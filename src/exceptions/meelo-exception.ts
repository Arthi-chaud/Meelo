import { HttpStatus } from "@nestjs/common";

export class MeeloException extends Error {
	constructor(protected readonly errorStatus: HttpStatus, message: string) {
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