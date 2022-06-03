import { AlreadyExistsException, NotFoundException } from "src/exceptions/meelo-exception";
import { Slug } from "src/slug/slug";

export class ArtistNotFoundException extends NotFoundException {
	constructor(artistSlug: Slug) {
		super(`Artist '${artistSlug.toString()}' not found`);
	}
}

export class ArtistalreadyExistsException extends AlreadyExistsException {
	constructor(artistSlug: Slug) {
		super(`Artist '${artistSlug.toString()}' already exists`);
	}
}