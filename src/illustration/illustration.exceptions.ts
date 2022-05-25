import { HttpStatus } from "@nestjs/common"
import { MeeloException } from "src/exceptions/meelo-exception"
import { Slug } from "src/slug/slug"

export class NoIllustrationFolderException extends MeeloException {
	constructor(resourceSlug: Slug) {
		super(HttpStatus.NOT_FOUND, `No illustration directory found for '${resourceSlug.toString()}'`)
	}
}

export class NoIllustrationException extends MeeloException {
	constructor(resourceSlug: Slug) {
		super(HttpStatus.NOT_FOUND, `No illustration found for '${resourceSlug.toString()}'`)
	}
}