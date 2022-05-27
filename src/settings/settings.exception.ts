import { InvalidRequestException, NotFoundException } from "src/exceptions/meelo-exception";

export class SettingsFileNotFoundException extends NotFoundException {
	constructor() {
		super("No settings.json file found");
	}
}

export class InvalidSettingsFileException extends InvalidRequestException {
	constructor() {
		super(`Invalid Settings File`);
	}
}