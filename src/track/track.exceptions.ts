import { AlreadyExistsException, NotFoundException } from "src/exceptions/meelo-exception"
import type Slug from "src/slug/slug";

export class TrackNotFoundException extends NotFoundException {
	constructor(trackName: string, releaseSlug: Slug, artistSlug?: Slug) {
		super(`Track '${trackName}' from '${releaseSlug.toString()}' ${artistSlug ? `by ${artistSlug.toString()}`: ''} not found`);
	}
}

export class MasterTrackNotFoundException extends NotFoundException {
	constructor(songSlug: Slug, artistSlug: Slug) {
		super(`Master Track of '${songSlug.toString()}' by ${artistSlug.toString()} not found`);
	}
}

export class TrackNotFoundByIdException extends NotFoundException {
	constructor(trackId: number) {
		super(`Track with id '${trackId}' not found`);
	}
}

export class TrackAlreadyExistsException extends AlreadyExistsException {
	constructor(trackName: string, releaseSlug: Slug, artistSlug?: Slug) {
		super(`Track '${trackName}' from '${releaseSlug.toString()}' ${artistSlug ? `by ${artistSlug.toString()}`: ''} already exists`);
	}
}
