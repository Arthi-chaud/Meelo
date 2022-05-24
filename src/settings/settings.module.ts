import { forwardRef, Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { FileManagerModule } from 'src/file-manager/file-manager.module';

@Module({
	imports: [forwardRef(() => FileManagerModule)],
	providers: [SettingsService],
	exports: [SettingsService],
	controllers: [SettingsController],
})
export class SettingsModule {}
