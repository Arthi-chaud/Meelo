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
	InvalidRequestException,
	NotFoundException,
} from "src/exceptions/meelo-exception";

export class ProviderMethodNotAvailableError extends InvalidRequestException {
	constructor(providerName: string) {
		super(`Provider ${providerName}: Method not available`);
	}
}

export class UnknownProviderError extends NotFoundException {
	constructor(providerName: string) {
		super(`Provider ${providerName}: Provider is unknown`);
	}
}

export class ProviderActionFailedError extends NotFoundException {
	constructor(providerName: string, actionName: string, message: string) {
		super(`Provider '${providerName}' '${actionName}' Failed: ${message}`);
	}
}

export class MissingExternalIdError extends NotFoundException {
	constructor(
		providerName: string,
		resourceType: string,
		resourceName: string,
	) {
		super(
			`Could not find External Id from ${providerName} not found for ${resourceType} '${resourceName}'.`,
		);
	}
}

export class AllProvidersFailedError extends NotFoundException {
	constructor() {
		super("All Providers Failed at task");
	}
}
