import { ForbiddenException } from "@nestjs/common";
import { AlreadyExistsException, InvalidRequestException, NotFoundException } from "src/exceptions/meelo-exception";

export class UserNotFoundException extends NotFoundException {
	constructor(username: string) {
		super(`No user with name '${username}' found.`);
	}
}

export class UserNotFoundFromCredentialsException extends NotFoundException {
	constructor(username: string) {
		super(`Invalid credentials for user '${username}'.`);
	}
}

export class UserNotFoundFromIDException extends NotFoundException {
	constructor(userId: number) {
		super(`User number '${userId}' not found`);
	}
}

export class UserAlreadyExistsException extends AlreadyExistsException {
	constructor(username: string) {
		super(`User '${username}' already exists`);
	}
}

export class UserNotEnabledException extends ForbiddenException {
	constructor(username: string) {
		super(`User '${username}' is not enabled.`);
	}
}

export class InvalidUsernameException extends InvalidRequestException {
	constructor() {
		super(`Username is invalid. Must be at least 4 chars long, composed of letters, digits, dashes and underscores`);
	}
}

export class InvalidPasswordException extends InvalidRequestException {
	constructor() {
		super(`Password is invalid. Must be at least 6 chars long, without spaces`);
	}
}