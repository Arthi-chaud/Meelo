import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class SettingsService {
	protected dataFolder: string;
	protected trackRegexes: string[];
	/// TODO shoud be set from constructor's parameter
	private readonly configPath: string = '/meelo/settings.json';

	constructor() {
		this.loadFromFile();
	}
	/**
	 * Loading Settings configuration from a JSON file
	 */
	loadFromFile() {
		let settings = JSON.parse(fs.readFileSync(this.configPath,'utf8'));
		this.dataFolder = settings.dataFolder;
		this.trackRegexes = settings.trackRegex;
	}
}
