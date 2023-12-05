import {
	Controller, Get, HttpStatus, Redirect
} from '@nestjs/common';
import type Settings from './models/settings';
import SettingsService from './settings.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import Admin from 'src/authentication/roles/admin.decorator';

@Admin()
@ApiTags("Settings")
@Controller('settings')
export default class SettingsController {
	constructor(private settingsService: SettingsService) {}

	@Get()
	@ApiOperation({
		summary: 'Get settings'
	})
	getSettings(): Settings {
		return this.settingsService.settingsValues;
	}

	@Get('reload')
	@ApiOperation({
		summary: 'Reload settings'
	})
	@Redirect('/settings', HttpStatus.FOUND)
	reload() {
		this.settingsService.loadFromFile();
	}
}
