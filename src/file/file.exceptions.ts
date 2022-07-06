import { NotFoundException } from "src/exceptions/meelo-exception";

export class FileNotFoundFromPathException extends NotFoundException {
	constructor(filePath: string) {
		super(`File '${filePath} not found'`);
	}
}

export class FileNotFoundFromIDException extends NotFoundException {
	constructor(fileId: number) {
		super(`File with id '${fileId} not found'`);
	}
}

export class FileNotFoundFromTrackIDException extends NotFoundException {
	constructor(trackId: number) {
		super(`File from track with id '${trackId} not found'`);
	}
}