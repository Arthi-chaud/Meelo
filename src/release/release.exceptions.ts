import { AlreadyExistsException, NotFoundException } from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

export class ReleaseNotFoundException extends NotFoundException {
	constructor(releaseSlug: Slug, albumSlug: Slug, artistSlug?: Slug) {
		super(`Release '${releaseSlug.toString()}' of ${albumSlug.toString()} ${artistSlug ? `by ${artistSlug.toString()}`: ''} not found`);
	}
}

export class ReleaseNotFoundFromIDException extends NotFoundException {
	constructor(releaseId: number) {
		super(`Release number '${releaseId}' not found`);
	}
}

export class ReleaseAlreadyExists extends AlreadyExistsException {
	constructor(releaseSlug: Slug, artistSlug?: Slug) {
		super(`Release '${releaseSlug.toString()}' ${artistSlug ? `by ${artistSlug.toString()} `: ''}already exists`);
	}
}

export class MasterReleaseNotFoundException extends NotFoundException {
	constructor(albumSlug: Slug, artistSlug?: Slug) {
		super(`Master Release of ${albumSlug.toString()} ${artistSlug ? `by ${artistSlug.toString()}`: ''} not found`);
	}
}

export class MasterReleaseNotFoundFromIDException extends NotFoundException {
	constructor(albumId: number) {
		super(`Master Release of album with id '${albumId}' not found`);
	}
}