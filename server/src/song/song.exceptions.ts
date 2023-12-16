import {
	AlreadyExistsException,
	InvalidRequestException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

export class SongNotFoundException extends NotFoundException {
	constructor(songSlug: Slug, artistSlug: Slug) {
		super(
			`'${songSlug.toString()}' from '${artistSlug.toString()}': No such song`,
		);
	}
}

export class SongNotFoundByIdException extends NotFoundException {
	constructor(songId: number) {
		super(`No song with id '${songId}' found`);
	}
}

export class SongAlreadyExistsException extends AlreadyExistsException {
	constructor(songSlug: Slug, artistSlug: Slug) {
		super(
			`'${songSlug.toString()}' from '${artistSlug.toString()}': Song already exists`,
		);
	}
}

export class SongNotEmptyException extends InvalidRequestException {
	constructor(songId: number) {
		super(`Song n°${songId} could not be deleted: It has related tracks`);
	}
}
