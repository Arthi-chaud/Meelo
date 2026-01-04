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

import { HttpStatus } from "@nestjs/common";
import { MeeloException } from "src/exceptions/meelo-exception";
import { Scrobbler } from "src/prisma/generated/client";

export class MissingScrobblerSettingsException extends MeeloException {
	constructor(scrobbler: Scrobbler, missingEnvVar: string) {
		super(
			HttpStatus.BAD_REQUEST, // yeah idk
			`Missing or empty env var '${missingEnvVar}' for ${scrobbler} scrobbler`,
		);
	}
}

export class ScrobblerDisabledException extends MeeloException {
	constructor(scrobbler: Scrobbler) {
		super(
			HttpStatus.BAD_REQUEST,
			`The scrobbler ${scrobbler} is not enabled.`,
		);
	}
}

export class EnablingScrobblerFailedException extends MeeloException {
	constructor(scrobbler: Scrobbler, errorMessage: string) {
		super(
			HttpStatus.INTERNAL_SERVER_ERROR,
			`Enabling ${scrobbler} failed: ${errorMessage}`,
		);
	}
}

export class ScrobblerRequestFailedException extends MeeloException {
	constructor(scrobbler: Scrobbler, errorMessage: string) {
		super(
			HttpStatus.INTERNAL_SERVER_ERROR,
			`Request to ${scrobbler} failed: ${errorMessage}`,
		);
	}
}
