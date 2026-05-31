import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import type { UploadedFile as LocalUploadedFile } from './storage.service';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/user-role.enum';
import { DemandSubfolder } from './enums/demand-subfolder.enum';
import type { Response } from 'express';

@Controller('files')
export class FilesController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload/:projectId/:subfolder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.NIVEL_3, Role.NIVEL_2, Role.PROFESSOR)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: LocalUploadedFile,
    @Param('projectId') projectId: string,
    @Param('subfolder') subfolder: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    // Security: Prevent path traversal by validating projectId format
    if (!/^[a-zA-Z0-9-]+$/.test(projectId)) {
      throw new BadRequestException('ID de projeto inválido.');
    }

    // Validate if the subfolder is a valid DemandSubfolder
    const validSubfolders = Object.values(DemandSubfolder) as string[];
    if (!validSubfolders.includes(subfolder.toLowerCase())) {
      throw new BadRequestException(
        `Subpasta inválida. As subpastas permitidas são: ${validSubfolders.join(', ')}`,
      );
    }

    // Security: Universal MIME Type Whitelist to prevent XSS and malicious executables
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/json',
      'text/plain',
      'text/csv',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Upload rejeitado por segurança. Tipo de arquivo não permitido: ${file.mimetype}. Use imagens, PDFs, ZIPs ou documentos simples.`,
      );
    }

    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.pdf',
      '.zip',
      '.json',
      '.txt',
      '.csv',
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Upload rejeitado. Extensão perigosa ou não permitida: ${ext}`,
      );
    }

    // ZIP Rule: Strict mimetype & extension validation for the 'zip' subfolder
    if (subfolder.toLowerCase() === DemandSubfolder.ZIP.toLowerCase()) {
      const isZip =
        file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.toLowerCase().endsWith('.zip');

      if (!isZip) {
        throw new BadRequestException(
          'Upload rejeitado. Esta subpasta aceita apenas arquivos compactados no formato ZIP (.zip).',
        );
      }
    }

    return await this.storageService.uploadFile(
      file,
      projectId,
      subfolder.toLowerCase(),
    );
  }

  @Get('download')
  async downloadFile(
    @Query('key') key: string,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    if (!key) {
      throw new BadRequestException('Chave do arquivo não fornecida.');
    }
    
    try {
      const buffer = await this.storageService.downloadBuffer(key);
      const filename = key.split('_').slice(1).join('_') || 'arquivo';
      const ext = filename.split('.').pop()?.toLowerCase();
      
      let mimeType = 'application/octet-stream';
      if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'zip') mimeType = 'application/zip';
      else if (ext === 'csv') mimeType = 'text/csv';
      
      res.setHeader('Content-Type', mimeType);
      
      if (download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      }
      
      return res.send(buffer);
    } catch (error) {
      throw new BadRequestException('Não foi possível carregar o arquivo.');
    }
  }

  @Get('mock-download')
  async mockDownload(@Query('key') key: string, @Res() res: Response) {
    if (!key) {
      throw new BadRequestException('Chave do arquivo não fornecida.');
    }
    const buffer = await this.storageService.getMemoryFile(key);
    if (!buffer) {
      throw new BadRequestException('Arquivo não encontrado em memória.');
    }
    // We try to guess the filename from the key (e.g. projetos/id/subfolder/timestamp_filename)
    const filename = key.split('_').slice(1).join('_') || 'download';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.send(buffer);
  }
}
