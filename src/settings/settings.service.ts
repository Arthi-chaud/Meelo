import {
	Inject, Injectable, forwardRef
} from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import type Settings from './models/settings';
import { metadataOrderValue, metadataSourceValue } from './models/settings';
import {
	InvalidSettingsFileException, InvalidSettingsTypeException, MissingSettingsException, SettingsFileNotFoundException
} from './settings.exception';

@Injectable()
export default class SettingsService {
	protected settings: Settings;
	private readonly configPath: string;

	constructor(
		@Inject(forwardRef(() => FileManagerService))
		private fileManagerService: FileManagerService
	) {
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
		if (this.settings.trackRegex.length < 1) {
			throw new InvalidSettingsFileException();
		}
	}

	/**
	 * Takes a JSON object as input, parses it and build a Settings interface instance
	 */
	private buildSettings(object: any): Settings {
		const settingsFields = {
			dataFolder: (i: any) => typeof i === 'string',
			trackRegex: (i: any) => Array.isArray(i),
			metadata: (i: any) => {
				if (typeof i !== 'object') {
					return false;
				}
				if (i.source === undefined) {
					throw new MissingSettingsException('source');
				} else if (i.order === undefined) {
					throw new MissingSettingsException('order');
				}
				return metadataSourceValue.includes(i.source) == true &&
					metadataOrderValue.includes(i.order) == true;
			}
		};
		let settingField: keyof typeof settingsFields;

		for (settingField in settingsFields) {
			const settingValue = object[settingField];

			if (settingValue === undefined) {
				throw new MissingSettingsException(settingField);
			} else if (settingsFields[settingField](settingValue) != true) {
				throw new InvalidSettingsTypeException(settingField, typeof settingValue);
			}
		}
		return {
			dataFolder: object.dataFolder,
			trackRegex: object.trackRegex,
			metadata: object.metadata
		};
	}

	get settingsValues(): Settings {
		return this.settings;
	}
}
