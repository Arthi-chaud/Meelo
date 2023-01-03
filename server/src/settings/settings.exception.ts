import { InvalidRequestException, NotFoundException } from "src/exceptions/meelo-exception";

export class InvalidMeeloDirVarException extends NotFoundException {
	constructor(value: any) {
		super(`Environemnt Variable 'MEELO_DIR' is valid. Got: '${value}'. Expected a path to a folder that exist`);
	}
}

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

export class MissingSettingsException extends InvalidRequestException {
	constructor(fieldName: string) {
		super(`Settings File: missing field '${fieldName}'`);
	}
}

export class InvalidSettingsTypeException extends InvalidRequestException {
	constructor(fieldName: string, actualType: string) {
		super(`Settings File: Invalid field '${fieldName}' type: ${actualType}`);
	}
}
