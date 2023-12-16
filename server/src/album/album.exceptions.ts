import {
	AlreadyExistsException,
	InvalidRequestException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

export class AlbumNotFoundException extends NotFoundException {
	constructor(albumSlug: Slug, artistSlug?: Slug) {
		super(
			`${albumSlug.toString()} ${
				artistSlug ? `by ${artistSlug.toString()}` : ""
			}: No such album`,
		);
	}
}

export class AlbumNotFoundFromIDException extends NotFoundException {
	constructor(id: number) {
		super(`No album with id ${id} exists`);
	}
}

export class AlbumAlreadyExistsException extends AlreadyExistsException {
	constructor(albumSlug: Slug, artistSlug?: Slug) {
		super(
			`${albumSlug.toString()} ${
				artistSlug ? `by ${artistSlug.toString()}` : ""
			} already exists`,
		);
	}
}

export class AlbumAlreadyExistsWithArtistIDException extends AlreadyExistsException {
	constructor(albumSlug: Slug, artistId: number) {
		super(`${albumSlug.toString()} by artist n°${artistId} already exists`);
	}
}

export class AlbumNotEmptyException extends InvalidRequestException {
	constructor(albumId: number) {
		super(
			`Album n°${albumId} could not be deleted: It has related releases`,
		);
	}
}
