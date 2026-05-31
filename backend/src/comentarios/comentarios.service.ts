import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateComentarioDto } from './dto/comentarios.dto';

@Injectable()
export class ComentariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(professorId: string, commentDto: CreateComentarioDto) {
    const created = await this.prisma.professor_comments.create({
      data: {
        author_id: professorId,
        target_id: commentDto.targetId,
        comment: commentDto.comment,
      },
    });

    return {
      id: created.id,
      authorId: created.author_id,
      targetId: created.target_id,
      comment: created.comment,
      createdAt: created.created_at.toISOString(),
    };
  }

  async findByEstagiario(targetId: string) {
    const comments = await this.prisma.professor_comments.findMany({
      where: { target_id: targetId },
      include: {
        users_professor_comments_author_idTousers: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return comments.map((c) => ({
      id: c.id,
      targetId: c.target_id,
      authorId: c.author_id,
      comment: c.comment,
      createdAt: c.created_at.toISOString(),
      author: {
        name: c.users_professor_comments_author_idTousers.name,
        role: c.users_professor_comments_author_idTousers.role,
      },
    }));
  }
}
