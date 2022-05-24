import { Module } from '@nestjs/common';
import { FileManagerModule } from 'src/file-manager/file-manager.module';
import { SettingsModule } from 'src/settings/settings.module';
import { MetadataService } from './metadata.service';

@Module({
  imports: [SettingsModule, FileManagerModule],
  providers: [MetadataService],
  exports: [MetadataService]
})
export class MetadataModule {}
