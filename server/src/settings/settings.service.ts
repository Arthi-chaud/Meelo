/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Inject, Injectable, forwardRef } from "@nestjs/common";
import FileManagerService from "src/file-manager/file-manager.service";
import Settings from "./models/settings";
import {
	InvalidMeeloDirVarException,
	InvalidSettingsFileException,
	MissingSettingsException,
	SettingsFileNotFoundException,
} from "./settings.exception";
import { join } from "path";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";

@Injectable()
export default class SettingsService {
	protected settings: Settings;
	private readonly configPath: string;

	constructor(
		@Inject(forwardRef(() => FileManagerService))
		private fileManagerService: FileManagerService,
	) {
		const meeloDir = process.env.INTERNAL_CONFIG_DIR;

		if (
			meeloDir == undefined ||
			!this.fileManagerService.folderExists(meeloDir)
		) {
			throw new InvalidMeeloDirVarException(meeloDir);
		}
		this.configPath = join(meeloDir, "settings.json");
		this.loadFromFile();
	}

	/**
	 * Loading Settings configuration from a JSON file
	 */
	loadFromFile(): void {
		let object: any = {};

		try {
			object = JSON.parse(
				this.fileManagerService
					.getFileContent(this.configPath)
					.toString(),
			);
		} catch (error) {
			if (error instanceof SyntaxError) {
				throw new InvalidSettingsFileException();
			}
			throw new SettingsFileNotFoundException();
		}
		const uncheckedSettings = plainToClass(Settings, {
			...object,
			meeloFolder: process.env.INTERNAL_CONFIG_DIR!,
			dataFolder: process.env.INTERNAL_DATA_DIR!,
			allowAnonymous: process.env.ALLOW_ANONYMOUS === "1",
		});
		// Validation
		const validationError = validateSync(uncheckedSettings, {
			forbidUnknownValues: true,
		}).at(0);

		if (validationError) {
			validationError.children
				?.concat(validationError)
				.forEach((error) => {
					const undefinedChild = error.children?.find(
						(child) => child.value === undefined,
					);

					if (error.value === undefined) {
						throw new MissingSettingsException(error.property);
					} else if (error.value && undefinedChild) {
						throw new MissingSettingsException(
							undefinedChild.property,
						);
					}
				});
			try {
				const constraint =
					validationError.constraints ??
					validationError.children?.at(0)?.constraints;
				const constraintName = Object.keys(constraint!).at(0)!;
				const constraintError = constraint![constraintName];

				if (constraintName == "nestedValidation") {
					throw new InvalidSettingsFileException();
				}
				throw new InvalidSettingsFileException(constraintError);
			} catch (err) {
				if (err instanceof InvalidSettingsFileException) {
					throw err;
				}
				throw new InvalidSettingsFileException();
			}
		}
		this.settings = uncheckedSettings;
	}

	get settingsValues(): Settings {
		return this.settings;
	}
}
