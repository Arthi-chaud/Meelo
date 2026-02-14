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

import { UnauthorizedRequestException } from "src/exceptions/meelo-exception";

export class UnauthorizedAnonymousRequestException extends UnauthorizedRequestException {
	constructor() {
		super("Authentication required");
	}
}

export class UnknownUserFromAccessTokenException extends UnauthorizedRequestException {
	constructor() {
		super("Token is not valid");
	}
}

export class UnknownUserException extends UnauthorizedRequestException {
	constructor() {
		super("Username or password is incorrect");
	}
}

export class DisabledUserAccountException extends UnauthorizedRequestException {
	constructor() {
		super(
			"User accound is not enabled, please contact server's administrator",
		);
	}
}

export class InsufficientPermissionsException extends UnauthorizedRequestException {
	constructor() {
		super("Admin-only action");
	}
}

export class MissingApiKeyPermissionsException extends UnauthorizedRequestException {
	constructor() {
		super("API Key is either missing or invalid");
	}
}
