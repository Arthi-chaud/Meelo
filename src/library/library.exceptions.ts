import { AlreadyExistsException } from "src/exceptions/meelo-exception";
import { Slug } from "src/slug/slug";

export class LibraryAlreadyExistsException extends AlreadyExistsException {
	constructor(librarySlug: Slug) {
		super(`A library with the slug '${librarySlug}' already exists`);
	}
}

export class LibraryNotFound extends AlreadyExistsException {
	constructor(librarySlug: Slug) {
		super(`'${librarySlug}': No such library`);
	}
}