import {
	Controller, Get, HttpStatus, Redirect
} from '@nestjs/common';
import type Settings from './models/settings';
import SettingsService from './settings.service';
import { ApiTags } from '@nestjs/swagger';
import Admin from 'src/roles/admin.decorator';

@Admin()
@ApiTags("Settings")
@Controller('settings')
export default class SettingsController {
	constructor(private settingsService: SettingsService) {}

	@Get()
	getSettings(): Settings {
		return this.settingsService.settingsValues;
	}

	@Get('reload')
	@Redirect('/settings', HttpStatus.FOUND)
	reload() {
		this.settingsService.loadFromFile();
	}
}
