import { Injectable } from '@nestjs/common';
import settingsJson from '/meelo/settings.json';

@Injectable()
export class SettingsService {
	readonly dataFolder: string;
	readonly trackRegexes: string[];
	constructor() {
		this.dataFolder = settingsJson.dataFolder;
		this.trackRegexes = settingsJson.trackRegex;
	}
}
