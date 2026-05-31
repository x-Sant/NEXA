import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { StorageService } from './storage.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [StorageService],
  exports: [StorageService],
})
export class FilesModule {}
