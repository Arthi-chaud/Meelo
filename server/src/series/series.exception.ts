import {
	AlreadyExistsException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import Slug from "src/slug/slug";

export class SeriesAlreadyExistsException extends AlreadyExistsException {
	constructor(seriesSlug: string | Slug) {
		super(`Series ${seriesSlug.toString()} already exists`);
	}
}

export class SeriesNotFoundException extends NotFoundException {
	constructor(seriesSlugOrId: Slug | number) {
		super(
			typeof seriesSlugOrId === "number"
				? `Series ${seriesSlugOrId} not found`
				: `Series '${seriesSlugOrId}' not found`,
		);
	}
}
