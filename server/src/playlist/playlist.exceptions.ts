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
	InvalidRequestException,
	NotFoundException,
	UnauthorizedRequestException,
} from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

export class PlaylistNotFoundException extends NotFoundException {
	constructor(playlistIdentifier: Slug | number) {
		super(
			typeof playlistIdentifier === "number"
				? `Playlist ${playlistIdentifier} not found`
				: `Playlist '${playlistIdentifier}' not found`,
		);
	}
}

export class UnallowedPlaylistUpdate extends UnauthorizedRequestException {
	constructor(playlistIdentifier: Slug | number) {
		super(
			`Playlist ${playlistIdentifier} cannot be modified by this user.`,
		);
	}
}

export class PlaylistAlreadyExistsException extends AlreadyExistsException {
	constructor(playlistName: string) {
		super(`Playlist '${playlistName}': Playlist already exists`);
	}
}

export class AddItemToPlaylistFailureException extends NotFoundException {
	constructor() {
		super("Adding item to playlist failed");
	}
}

export class PlaylistEntryNotFoundException extends NotFoundException {
	constructor(entryId: number) {
		super(`Playlist entry ${entryId} not found`);
	}
}

export class InvalidPlaylistEntryIndexException extends InvalidRequestException {
	constructor() {
		super("Invalid Playlist entry Index");
	}
}

export class PlaylistReorderInvalidArrayException extends InvalidRequestException {
	constructor() {
		super("Invalid Playlist Reoder array");
	}
}
