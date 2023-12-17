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

class ParsingException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.INTERNAL_SERVER_ERROR, message);
	}
}

export class FileParsingException extends ParsingException {
	constructor(filePath: string) {
		super(`Parsing file '${filePath}' failed.`);
	}
}

export class MissingMetadataException extends ParsingException {
	constructor(filePath: string) {
		super(`Parsing file '${filePath}' failed because of missing metadata.`);
	}
}

export class BadMetadataException extends ParsingException {
	constructor(error: string) {
		super(`Bad Metadata: ${error}.`);
	}
}

export class PathParsingException extends ParsingException {
	constructor(filePath: string) {
		super(
			`Aborting parsing of '${filePath}' file: It doesn't match any of the regex, or catch groups are missing`,
		);
	}
}
