import { forwardRef, Module } from '@nestjs/common';
import { SettingsModule } from 'src/settings/settings.module';
import { FileManagerService } from './file-manager.service';

@Module({
  imports: [forwardRef(() => SettingsModule)],
  providers: [FileManagerService],
  exports: [FileManagerService]
})
export class FileManagerModule {}
