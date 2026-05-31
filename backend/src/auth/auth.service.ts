import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const { email, password } = loginDto;

    // Find user in database
    const dbUser = await this.prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (dbUser && dbUser.is_active) {
      if (dbUser.locked_until && dbUser.locked_until > new Date()) {
        throw new UnauthorizedException('Conta temporariamente bloqueada. Tente novamente mais tarde.');
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        dbUser.password_hash || '',
      );
      if (isPasswordValid) {
        const payload = {
          sub: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash, cpf_cnpj_encrypted, ...userWithoutPassword } = dbUser;

        await this.prisma.users.update({
          where: { id: dbUser.id },
          data: {
            last_login_at: new Date(),
            failed_login_count: 0,
            locked_until: null,
          },
        });

        const refreshToken = crypto.randomBytes(32).toString('hex');
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        await this.prisma.user_sessions.create({
          data: {
            user_id: dbUser.id,
            refresh_token_hash: refreshTokenHash,
            ip_address: ipAddress || '127.0.0.1',
            user_agent: userAgent || 'Unknown',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          }
        });

        return {
          user: userWithoutPassword,
          accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
          refreshToken,
        };
      } else {
        const failedCount = dbUser.failed_login_count + 1;
        const lockedUntil = failedCount >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await this.prisma.users.update({
          where: { id: dbUser.id },
          data: {
            failed_login_count: failedCount,
            locked_until: lockedUntil,
          },
        });
      }
    }

    throw new UnauthorizedException('Credenciais inválidas.');
  }

  async refresh(refreshToken: string) {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await this.prisma.user_sessions.findUnique({
      where: { refresh_token_hash: refreshTokenHash },
      include: { users: true },
    });

    if (!session || session.is_revoked || session.expires_at < new Date()) {
      throw new UnauthorizedException('Token de atualização inválido ou expirado.');
    }

    const dbUser = session.users;
    if (!dbUser || !dbUser.is_active) {
      throw new UnauthorizedException('Usuário inativo.');
    }

    const payload = {
      sub: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.user_sessions.updateMany({
      where: { refresh_token_hash: refreshTokenHash },
      data: { is_revoked: true },
    });
  }

  async changePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
        password_needs_change: false,
      },
    });
    return { success: true };
  }
}
