import {
	InvalidRequestException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

export class GenreNotFoundException extends NotFoundException {
	constructor(genreSlug: Slug) {
		super(`Genre '${genreSlug.toString()}' does not exist`);
	}
}

export class GenreNotFoundByIdException extends NotFoundException {
	constructor(genreId: number) {
		super(`Genre with id '${genreId}' does not exist`);
	}
}

export class GenreAlreadyExistsException extends NotFoundException {
	constructor(genreSlug: Slug) {
		super(`Genre '${genreSlug.toString()}' already exists`);
	}
}

export class GenreNotEmptyException extends InvalidRequestException {
	constructor(genreId: number) {
		super(`Genre n°${genreId} could not be deleted: It has related songs`);
	}
}
