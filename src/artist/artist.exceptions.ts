import { AlreadyExistsException, InvalidRequestException, NotFoundException } from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

export class ArtistNotFoundException extends NotFoundException {
	constructor(artistSlug: Slug) {
		super(`Artist '${artistSlug.toString()}' not found`);
	}
}

export class CompilationArtistException extends InvalidRequestException {
	constructor(resourceName: string) {
		super(`The '${resourceName}' resource can not be accessed for the 'Compilation' artist`);
	}
}

export class ArtistNotFoundByIDException extends NotFoundException {
	constructor(artistId: number) {
		super(`Artist with id '${artistId}' not found`);
	}
}

export class ArtistAlreadyExistsException extends AlreadyExistsException {
	constructor(artistSlug: Slug) {
		super(`Artist '${artistSlug.toString()}' already exists`);
	}
}