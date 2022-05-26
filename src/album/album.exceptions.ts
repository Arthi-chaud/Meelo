import { NotFoundException } from "src/exceptions/meelo-exception";
import { Slug } from "src/slug/slug";

export class AlbumNotFoundException extends NotFoundException {
	constructor(albumSlug: Slug, artistSlug: Slug) {
		super(`${albumSlug.toString()} by ${artistSlug.toString()}: No such album`);
	}
}