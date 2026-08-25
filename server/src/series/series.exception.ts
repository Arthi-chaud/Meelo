import {
	AlreadyExistsException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import Slug from "src/slug/slug";

export class SeriesAlreadyExistsException extends AlreadyExistsException {
	constructor(labelSlug: string | Slug) {
		super(`Series ${labelSlug.toString()} already exists`);
	}
}

export class SeriesNotFoundException extends NotFoundException {
	constructor(labelSlugOrId: Slug | number) {
		super(
			typeof labelSlugOrId === "number"
				? `Series ${labelSlugOrId} not found`
				: `Series '${labelSlugOrId}' not found`,
		);
	}
}
