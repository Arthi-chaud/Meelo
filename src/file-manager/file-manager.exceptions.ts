import { NotFoundException } from "src/exceptions/meelo-exception";

export class FolderDoesNotExists extends NotFoundException {
	constructor(folderPath: string) {
		super(`Folder '${folderPath}' does not exist`)
	}
}