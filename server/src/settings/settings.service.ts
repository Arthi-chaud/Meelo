import {
	Inject, Injectable, forwardRef
} from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import Settings, { metadataOrderValue, metadataSourceValue } from './models/settings';
import {
	InvalidMeeloDirVarException,
	InvalidSettingsFileException,
	InvalidSettingsTypeException,
	MissingSettingsException,
	SettingsFileNotFoundException
} from './settings.exception';
import { join } from 'path';

@Injectable()
export default class SettingsService {
	protected settings: Settings;
	private readonly configPath: string;

	constructor(
		@Inject(forwardRef(() => FileManagerService))
		private fileManagerService: FileManagerService
	) {
		const meeloDir = process.env.MEELO_DIR;

		if (meeloDir == undefined || !this.fileManagerService.folderExists(meeloDir)) {
			throw new InvalidMeeloDirVarException(meeloDir);
		}
		this.configPath = join(
			meeloDir,
			'settings.json'
		);
		this.loadFromFile();
	}

	/**
	 * Loading Settings configuration from a JSON file
	 */
	loadFromFile(): void {
		let object: any = {};

		try {
			object = JSON.parse(this.fileManagerService.getFileContent(this.configPath).toString());
		} catch (error) {
			if (error instanceof SyntaxError) {
				throw new InvalidSettingsFileException();
			}
			throw new SettingsFileNotFoundException();
		}
		this.settings = {
			meeloFolder: process.env.MEELO_DIR!,
			...this.buildSettings(object)
		};
		if (this.settings.trackRegex.length < 1) {
			throw new InvalidSettingsFileException();
		}
	}

	/**
	 * Takes a JSON object as input, parses it and build a Settings interface instance
	 */
	private buildSettings(object: any): Omit<Settings, 'meeloFolder'> {
		const settingsFields = {
			dataFolder: (value: unknown) => typeof value === 'string',
			trackRegex: (value: unknown) => Array.isArray(value),
			metadata: (value: any) => {
				if (typeof value !== 'object') {
					return false;
				}
				if (value.source === undefined) {
					throw new MissingSettingsException('source');
				} else if (value.order === undefined) {
					throw new MissingSettingsException('order');
				}
				return metadataSourceValue.includes(value.source) == true &&
					metadataOrderValue.includes(value.order) == true;
			}
		};
		// eslint-disable-next-line init-declarations
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
