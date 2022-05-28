import { Controller, Get, HttpException, HttpStatus, Redirect, Req, Res, Response } from '@nestjs/common';
import { Settings } from './models/settings';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
	constructor(private settingsService: SettingsService) {}
	
	@Get()
	getSettings(): Settings {
		return this.settingsService.settingsContent;
	}

	@Get('reload')
	@Redirect('/settings', HttpStatus.FOUND)
	reload() {
		this.settingsService.loadFromFile();
	}
	
}
