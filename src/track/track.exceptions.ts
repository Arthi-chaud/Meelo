import { NotFoundException } from "src/exceptions/meelo-exception"
import { Slug } from "src/slug/slug";

export class TrackNotFoundException extends NotFoundException {
	constructor(trackName: string, releaseSlug: Slug, artistSlug?: Slug) {
		super(`Track '${trackName}' from '${releaseSlug.toString()}' ${artistSlug ? `by ${artistSlug.toString()}`: ''} not found`);
	}
}

export class TrackNotFoundByIdException extends NotFoundException {
	constructor(trackId: number) {
		super(`Track with id '${trackId}' not found`);
	}
}