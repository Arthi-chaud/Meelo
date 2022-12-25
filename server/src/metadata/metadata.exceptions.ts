import { HttpStatus } from "@nestjs/common";
import { MeeloException } from "src/exceptions/meelo-exception";
import path from 'path';

class ParsingException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.INTERNAL_SERVER_ERROR, message);
	}
}

export class FileParsingException extends ParsingException {
	constructor(filePath: string) {
		super(`Parsing file '${path.parse(filePath).base}' failed.`);
	}
}

export class MissingMetadataException extends ParsingException {
	constructor(filePath: string) {
		super(`Parsing file '${path.parse(filePath).base}' failed because of missing metadata.`);
	}
}

export class PathParsingException extends ParsingException {
	constructor(filePath: string) {
		super(`Aborting parsing of '${path.parse(filePath).base}' file: It doesn't match any of the regex, or catch groups are missing`);
	}
}
