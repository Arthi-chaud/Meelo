import { NotFoundException } from "src/exceptions/meelo-exception";
import { Slug } from "src/slug/slug";

export class ReleaseNotFoundException extends NotFoundException {
	constructor(releaseId: number, albumSlug: Slug, artistSlug: Slug) {
		super(`Release ${releaseId} of ${albumSlug.toString()} by ${artistSlug.toString()} not found`);
	}
}

export class MasterReleaseNotFoundException extends NotFoundException {
	constructor(albumSlug: Slug, artistSlug: Slug) {
		super(`Master Release of ${albumSlug.toString()} by ${artistSlug.toString()} not found`);
	}
}