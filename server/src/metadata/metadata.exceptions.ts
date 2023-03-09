import { HttpStatus } from "@nestjs/common";
import { MeeloException } from "src/exceptions/meelo-exception";

class ParsingException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.INTERNAL_SERVER_ERROR, message);
	}
}

export class FileParsingException extends ParsingException {
	constructor(filePath: string) {
		super(`Parsing file '${filePath}' failed.`);
	}
}

export class MissingMetadataException extends ParsingException {
	constructor(filePath: string) {
		super(`Parsing file '${filePath}' failed because of missing metadata.`);
	}
}

export class MissingMetadataFieldException extends ParsingException {
	constructor(missingField: string) {
		super(`Parsing file failed because of missing field: ${missingField}.`);
	}
}

export class PathParsingException extends ParsingException {
	constructor(filePath: string) {
		super(`Aborting parsing of '${filePath}' file: It doesn't match any of the regex, or catch groups are missing`);
	}
}
