import { AlreadyExistsException, NotFoundException } from "src/exceptions/meelo-exception";
import { Slug } from "src/slug/slug";


export class SongNotFoundException extends NotFoundException {
	constructor(songSlug: Slug, artistSlug: Slug) {
		super(`'${songSlug.toString()}' from '${artistSlug.toString()}': No such song`);
	}
}

export class SongAlreadyExistsException extends AlreadyExistsException {
	constructor(songSlug: Slug, artistSlug: Slug) {
		super(`'${songSlug.toString()}' from '${artistSlug.toString()}': Song already exists`);
	}
}