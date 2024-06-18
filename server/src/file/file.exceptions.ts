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
	AlreadyExistsException,
	NotFoundException,
} from "src/exceptions/meelo-exception";

export class FileNotFoundException extends NotFoundException {
	constructor(filePathOrIdentifier: string | number) {
		super(
			typeof filePathOrIdentifier === "number"
				? `File with id '${filePathOrIdentifier}' not found`
				: `File '${filePathOrIdentifier}' not found`,
		);
	}
}

export class SourceFileNotFoundException extends NotFoundException {
	constructor(filePath: string) {
		super(`File at path '${filePath}' not found`);
	}
}

export class FileNotFoundFromTrackIDException extends NotFoundException {
	constructor(trackId: number) {
		super(`File from track with id '${trackId}' not found`);
	}
}

export class FileAlreadyExistsException extends AlreadyExistsException {
	constructor(filePath: string, libraryId: number) {
		super(
			`File '${filePath}' has already been registered for library n°'${libraryId}'`,
		);
	}
}
