import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class SettingsService {
	readonly dataFolder: string;
	readonly trackRegexes: string[];
	constructor() {
		let settings = JSON.parse(fs.readFileSync('/meelo/settings.json','utf8'));
		this.dataFolder = settings.dataFolder;
		this.trackRegexes = settings.trackRegex;
	}
}
