import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { InvalidSettingsFileException, SettingsFileNotFoundException } from './settings.exception';

@Injectable()
export class SettingsService {
	protected dataFolder: string;
	protected trackRegexes: string[];
	private readonly configPath: string;

	constructor(
		@Inject(forwardRef(() => FileManagerService))
		private fileManagerService: FileManagerService) {
		this.configPath = `${this.fileManagerService.configFolderPath}/settings.json`;
		this.loadFromFile();
	}
	/**
	 * Loading Settings configuration from a JSON file
	 */
	loadFromFile(): void {
		try {
			let settings = JSON.parse(this.fileManagerService.getFileContent(this.configPath).toString());
			this.dataFolder = settings.dataFolder;
			this.trackRegexes = settings.trackRegex;
		} catch (e) {
			if (e instanceof SyntaxError) {
				throw new InvalidSettingsFileException();
			}
			throw new SettingsFileNotFoundException();
		}
	}

	/**
	 * Retrieve protected dataFolder value
	 */
	getDataFolder(): string {
		return this.dataFolder;
	}

	/**
	 * Retrieve protected RegExpr values
	 */
	getTrackRegexes(): string[] {
		return this.trackRegexes;
	}
}
