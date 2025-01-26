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

import { HttpStatus } from "@nestjs/common";

export class MeeloException extends Error {
	constructor(
		protected readonly errorStatus: HttpStatus,
		message: string,
	) {
		super(message);
	}

	/**
	 * @returns A recommended HTTP status code if the exception is caught by the filter
	 */
	getErrorStatus(): HttpStatus {
		return this.errorStatus;
	}
}

/**
 * Exception that, if caught by the global filter will return a 404 HTTP response
 * This is used when a ressource is not found
 */
export class NotFoundException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.NOT_FOUND, message);
	}
}

/**
 * Exception which, if caught by the global filter will return a 404 HTTP response
 * This is used when a resourse is found but not usable/readable
 */
export class NotAccessibleException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.INTERNAL_SERVER_ERROR, message);
	}
}

/**
 * Exception which, if caught by the global filter will return a 409 HTTP response
 * Used when a resource creation or modification leads to a data overlap
 */
export class AlreadyExistsException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.CONFLICT, message);
	}
}

/**
 * Exception which, if caught by the global filter will return a 400 HTTP response
 * Used when the request is invalid, or badly formed
 */
export class InvalidRequestException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.BAD_REQUEST, message);
	}
}

/**
 * Exception which, if caught by the global filter will return a 401 HTTP response
 * Used when a protected route is requested by an anonymous user
 */
export class UnauthorizedRequestException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.UNAUTHORIZED, `Unauthorized: ${message}`);
	}
}
