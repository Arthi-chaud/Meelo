import { Injectable } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';

@Injectable()
export class FileManagerService {
	constructor(private settingsService: SettingsService) {}
}
