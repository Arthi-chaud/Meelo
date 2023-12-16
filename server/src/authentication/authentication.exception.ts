import { UnauthorizedRequestException } from "src/exceptions/meelo-exception";

export class UnauthorizedAnonymousRequestException extends UnauthorizedRequestException {
	constructor() {
		super("Authentication required");
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
