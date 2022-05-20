import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
	providers: [SettingsService],
	exports: [SettingsService],
	controllers: [SettingsController],
})
export class SettingsModule {}
