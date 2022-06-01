import { AlreadyExistsException, NotFoundException } from "src/exceptions/meelo-exception";
import { Slug } from "src/slug/slug";

export class ReleaseNotFoundException extends NotFoundException {
	constructor(releaseName: string, albumSlug: Slug, artistSlug: Slug) {
		super(`Release '${releaseName}' of ${albumSlug.toString()} by ${artistSlug.toString()} not found`);
	}
}

export class ReleaseAlreadyExists extends AlreadyExistsException {
	constructor(releaseTitle: string, artistSlug: Slug) {
		super(`Release ${releaseTitle} by ${artistSlug.toString()} already exists`);
	}
}

export class MasterReleaseNotFoundException extends NotFoundException {
	constructor(albumSlug: Slug, artistSlug: Slug) {
		super(`Master Release of ${albumSlug.toString()} by ${artistSlug.toString()} not found`);
	}
}