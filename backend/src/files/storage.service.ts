import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
}

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private readonly bucketName = 'nexa-files';

  constructor() {
    // 3 - "Vamos manter em memória por enquanto"
    // To prevent crashes when SUPABASE_URL is missing, we will use an in-memory fallback
    const supabaseUrl = process.env.SUPABASE_URL || 'mock';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'mock';

    if (supabaseUrl !== 'mock') {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  // Fallback in-memory storage for when Supabase is not configured
  private memoryFiles = new Map<string, Buffer>();

  async uploadFile(
    file: UploadedFile,
    projectId: string,
    subfolder: string,
  ): Promise<{
    fileKey: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
  }> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const virtualPath = `projetos/${projectId}/${subfolder}/${timestamp}_${sanitizedFilename}`;

    if (this.supabase) {
      // 1. Faz o upload físico para o Bucket Privado
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(virtualPath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        throw new BadRequestException(
          `Erro ao enviar arquivo para o Supabase: ${error.message}`,
        );
      }
    } else {
      // IN MEMORY FALLBACK
      this.memoryFiles.set(virtualPath, file.buffer);
    }

    // Retorna a URL permanente apontando para o proxy seguro do nosso backend
    const backendUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const proxyUrl = `${backendUrl}/files/download?key=${virtualPath}`;

    return {
      fileKey: virtualPath,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      url: proxyUrl,
    };
  }

  // Gera uma URL assinada temporária válida por 60 segundos
  async getSignedUrl(key: string): Promise<string> {
    if (!key) {
      throw new BadRequestException('Chave do arquivo não fornecida.');
    }

    if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(key, 60);

      if (error || !data) {
        throw new BadRequestException(
          `Erro ao gerar link de download: ${error?.message}`,
        );
      }
      return data.signedUrl;
    } else {
      // IN MEMORY FALLBACK - In a real scenario we'd return a direct endpoint to serve the buffer
      // For now we just return a placeholder or the proxy url directly since we don't have a buffer server
      return `/files/mock-download?key=${key}`;
    }
  }

  // Baixa o arquivo do Supabase (ou da memória) e retorna o Buffer
  async downloadBuffer(key: string): Promise<Buffer> {
    if (!key) throw new BadRequestException('Chave do arquivo não fornecida.');

    if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(key);

      if (error || !data) {
        throw new BadRequestException(
          `Erro ao baixar arquivo do Supabase: ${error?.message}`,
        );
      }
      
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else {
      // IN MEMORY FALLBACK
      const buffer = this.memoryFiles.get(key);
      if (!buffer) {
        throw new BadRequestException('Arquivo não encontrado em memória.');
      }
      return buffer;
    }
  }

  // To serve the in-memory file:
  async getMemoryFile(key: string): Promise<Buffer | null> {
    return this.memoryFiles.get(key) || null;
  }
}
