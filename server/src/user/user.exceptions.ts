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

import { ForbiddenException, HttpStatus } from "@nestjs/common";
import {
	AlreadyExistsException,
	InvalidRequestException,
	MeeloException,
	NotFoundException,
} from "src/exceptions/meelo-exception";

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

export class UserNotFoundFromJwtPayload extends NotFoundException {
	constructor(username: string, id: number) {
		super(`User ${id} named '${username}' does not exist.`);
	}
}

export class InvalidUserCredentialsException extends MeeloException {
	constructor(username: string) {
		super(HttpStatus.FORBIDDEN, `Invalid Password for user '${username}'.`);
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
		super(
			"Username is invalid. Must be at least 4 chars long, composed of letters, digits, dashes and underscores",
		);
	}
}

export class InvalidPasswordException extends InvalidRequestException {
	constructor() {
		super(
			"Password does not match criteria. Must be at least 6 chars long, without spaces",
		);
	}
}
