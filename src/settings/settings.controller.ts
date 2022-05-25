import { Controller, Get, HttpException, HttpStatus, Redirect, Req, Res, Response } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
	constructor(private settingsService: SettingsService) {}
	
	@Get()
	getSettings(): object {
		return this.settingsService;
	}

	@Get('reload')
	@Redirect('/settings', HttpStatus.FOUND)
	reload(@Res() res: Response) {
		try {
			this.settingsService.loadFromFile();
		} catch (exception) {
			throw new HttpException({
				error: exception.message
			}, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
}
