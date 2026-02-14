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

import {
	InvalidRequestException,
	NotFoundException,
} from "src/exceptions/meelo-exception";

export class InvalidConfigDirVarException extends NotFoundException {
	constructor(value: any) {
		super(
			`Environemnt Variable 'INTERNAL_CONFIG_DIR' is valid. Got: '${value}'. Expected a path to a folder that exist`,
		);
	}
}

export class SettingsFileNotFoundException extends NotFoundException {
	constructor() {
		super("No settings.json file found");
	}
}

export class InvalidSettingsFileException extends InvalidRequestException {
	constructor(validationError?: string) {
		super(
			`Invalid Settings File${
				validationError ? `: ${validationError}` : ""
			}`,
		);
	}
}

export class MissingSettingsException extends InvalidRequestException {
	constructor(fieldName: string) {
		super(`Settings File: missing field '${fieldName}'`);
	}
}
