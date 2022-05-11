import { Injectable } from '@nestjs/common';
import settingsJson from '/meelo/settings.json';

@Injectable()
export class SettingsService {
	readonly libraryPath: string;
	readonly trackRegexes: string[];
	constructor() {
		this.libraryPath = settingsJson.libraryPath;
		this.trackRegexes = settingsJson.trackRegex;
	}
}
