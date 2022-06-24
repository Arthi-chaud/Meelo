import { NotFoundException } from "src/exceptions/meelo-exception";

export class FileDoesNotExistException extends NotFoundException {
	constructor(fileName: string) {
		super(`${fileName}: No such file`);
	}
}
export class FolderDoesNotExistException extends NotFoundException {
	constructor(folderPath: string) {
		super(`Folder '${folderPath}' does not exist`)
	}
}

export class FileNotReadableException extends NotFoundException {
	constructor(fileName: string) {
		super(`${fileName}: Permission denied`);
	}
}