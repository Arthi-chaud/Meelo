import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { Settings } from './models/settings';
import { InvalidSettingsFileException, SettingsFileNotFoundException } from './settings.exception';

@Injectable()
export class SettingsService {
	protected settings: Settings; 
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
		let object: any;
		try {
			object = JSON.parse(this.fileManagerService.getFileContent(this.configPath).toString());
		} catch (e) {
			if (e instanceof SyntaxError) {
				throw new InvalidSettingsFileException();
			}
			throw new SettingsFileNotFoundException();
		}
		this.settings = this.buildSettings(object);
	}

	/**
	 * Takes a JSON object as input, parses it and build a Settings interface instance
	 */
	private buildSettings(object: any): Settings {
		if (object.dataFolder === undefined ||
			object.trackRegex === undefined ||
			object.releaseNameFromPath === undefined ||
			object.mergeMetadataWithPathRegexGroup === undefined)
			throw new InvalidSettingsFileException();
		return {
			dataFolder: object.dataFolder,
			trackRegex: object.trackRegex,
			releaseNameFromPath: object.releaseNameFromPath,
			mergeMetadataWithPathRegexGroup: object.mergeMetadataWithPathRegexGroup
		};
	}

	/**
	 * Retrieve protected dataFolder value
	 */
	get baseDataFolder(): string {
		return this.settings.dataFolder;
	}

	/**
	 * Retrieve protected RegExpr values
	 */
	get trackRegexes(): string[] {
		return this.settings.trackRegex;
	}

	get usePathToGetReleaseName(): boolean {
		return this.settings.releaseNameFromPath;
	}

	get usePathAsMetadataSource(): boolean {
		return this.settings.mergeMetadataWithPathRegexGroup;
	}
}
