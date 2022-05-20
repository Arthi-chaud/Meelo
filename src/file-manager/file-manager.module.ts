import { Module } from '@nestjs/common';
import { SettingsModule } from 'src/settings/settings.module';
import { FileManagerService } from './file-manager.service';

@Module({
  providers: [FileManagerService],
  imports: [SettingsModule]
})
export class FileManagerModule {}
