/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AlreadyExistsException,
	InvalidRequestException,
	NotFoundException,
} from "src/exceptions/meelo-exception";
import type Slug from "src/slug/slug";
import type { CreateExternalMetadataDto } from "./models/external-metadata.dto";
import type ExternalMetadataQueryParameters from "./models/external-metadata.query-parameters";

export class ProviderAlreadyExistsException extends AlreadyExistsException {
	constructor(providerSlug: Slug) {
		super(`Provider '${providerSlug.toString()}' already exists`);
	}
}

export class ProviderNotFoundException extends NotFoundException {
	constructor(providerSlugOrId: Slug | number) {
		super(
			typeof providerSlugOrId === "number"
				? `Provider with id ${providerSlugOrId} does not exist`
				: `Provider '${providerSlugOrId.toString()}' not found`,
		);
	}
}

export class ExternalMetadataNotFoundException extends NotFoundException {
	constructor(_whereInput: ExternalMetadataQueryParameters.WhereInput) {
		super("External Metadata entry not found");
	}
}

export class DuplicateSourcesInExternalMetadataDto extends InvalidRequestException {
	constructor() {
		super("The same provider was included twice in the sources.");
	}
}

export class MissingExternalMetadataResourceIdException extends InvalidRequestException {
	constructor(_data: CreateExternalMetadataDto) {
		super("Missing Album, Artist, Song or Release ID");
	}
}

export class ExternalMetadataResourceNotFoundException extends NotFoundException {
	constructor(_data: CreateExternalMetadataDto) {
		super("Album, Artist, Song or Release not found");
	}
}

export class ExternalMetadataEntryExistsException extends AlreadyExistsException {
	constructor(_data: CreateExternalMetadataDto) {
		super("External Metadata entry already exists for this resource");
	}
}
