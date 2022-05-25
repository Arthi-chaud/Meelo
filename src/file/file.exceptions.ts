import { NotFoundException } from "src/exceptions/meelo-exception";

export class FileNotFoundException extends NotFoundException {
	constructor(fileName: string) {
		super(`${fileName}: No such file`);
	}
}

export class FileNotReadableException extends NotFoundException {
	constructor(fileName: string) {
		super(`${fileName}: Permission denied`);
	}
}