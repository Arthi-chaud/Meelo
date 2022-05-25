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

export class NotFoundException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.NOT_FOUND, message);
	}
}

export class NotAccessibleException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.NOT_FOUND, message);
	}
}

export class AlreadyExistsException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.CONFLICT, message);
	}
}

export class InvalidRequestException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.BAD_REQUEST, message);
	}
}