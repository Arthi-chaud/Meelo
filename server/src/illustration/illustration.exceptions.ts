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
import compilationAlbumArtistKeyword from "src/constants/compilation";
import {
	InvalidRequestException,
	MeeloException,
} from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

class NoIllustrationFolderException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.NOT_FOUND, message);
	}
}

export class MissingIllustrationResourceIdException extends InvalidRequestException {
	constructor() {
		super("Missing Album, Artist, Song or Release ID");
	}
}

export class NoArtistFolderIllustrationException extends NoIllustrationFolderException {
	constructor(artistSlug: Slug) {
		super(
			`No illustration folder found for artist '${artistSlug.toString()}'`,
		);
	}
}

export class NoAlbumFolderIllustrationException extends NoIllustrationFolderException {
	constructor(albumSlug: Slug) {
		super(
			`No illustration folder found for album '${albumSlug.toString()}'`,
		);
	}
}

export class NoReleaseFolderIllustrationException extends NoIllustrationFolderException {
	constructor(albumSlug: Slug, releaseSlug: Slug) {
		super(
			`No illustration folder found for release '${releaseSlug.toString()}' of ${albumSlug.toString()}`,
		);
	}
}

export class NoIllustrationException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.NOT_FOUND, message);
	}
}

export class NoArtistIllustrationException extends NoIllustrationException {
	constructor(artistSlug?: Slug) {
		super(
			`No illustration found for artist '${
				artistSlug?.toString() ?? compilationAlbumArtistKeyword
			}'`,
		);
	}
}

export class NoAlbumIllustrationException extends NoIllustrationException {
	constructor(albumSlug: Slug) {
		super(`No illustration found for album '${albumSlug.toString()}'`);
	}
}

export class NoReleaseIllustrationException extends NoIllustrationException {
	constructor(albumSlug: Slug, releaseSlug: Slug) {
		super(
			`No illustration found for release '${releaseSlug.toString()}' of ${albumSlug.toString()}`,
		);
	}
}

export class NoTrackIllustrationException extends NoIllustrationException {
	constructor(trackId: number) {
		super(`No illustration found for track  n°${trackId}`);
	}
}

export class CantDownloadIllustrationException extends InvalidRequestException {
	constructor(illustrationURL: string) {
		super(`Illustration could not be downloaded from '${illustrationURL}'`);
	}
}

export class IllustrationNotExtracted extends InvalidRequestException {
	constructor(trackSourceFileName: string) {
		super(
			`Illustration from file '${trackSourceFileName}' could not be extracted`,
		);
	}
}

export class IllustrationNotFoundException extends NoIllustrationException {
	constructor(illustrationId: number) {
		super(`No illustration found with ID ${illustrationId.toString()}`);
	}
}
