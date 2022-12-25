import { AlreadyExistsException, NotFoundException } from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";

export class LibraryAlreadyExistsException extends AlreadyExistsException {
	constructor(librarySlug: Slug, path: string) {
		super(`A library with the slug '${librarySlug}' or with path '${path}' already exists`);
	}
}

export class LibraryNotFoundException extends NotFoundException {
	constructor(librarySlug: Slug) {
		super(`'${librarySlug}': No such library`);
	}
}

export class LibraryNotFoundFromIDException extends NotFoundException {
	constructor(libraryId: number) {
		super(`No library found with id '${libraryId}'`);
	}
}
