import { HttpStatus } from "@nestjs/common"
import { InvalidRequestException, MeeloException } from "src/exceptions/meelo-exception"
import { Slug } from "src/slug/slug"

class NoIllustrationFolderException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.NOT_FOUND, message);
	}
}

export class NoArtistFolderIllustrationException extends NoIllustrationFolderException {
	constructor(artistSlug: Slug) {
		super(`No illustration folder found for artist '${artistSlug.toString()}'`)
	}
}

export class NoAlbumFolderIllustrationException extends NoIllustrationFolderException {
	constructor(albumSlug: Slug) {
		super(`No illustration folder found for album '${albumSlug.toString()}'`)
	}
}

export class NoReleaseFolderIllustrationException extends NoIllustrationFolderException {
	constructor(albumSlug: Slug, releaseSlug: Slug) {
		super(`No illustration folder found for release '${releaseSlug.toString()}' of ${albumSlug.toString()}`)
	}
}

export class NoIllustrationException extends MeeloException {
	constructor(message: string) {
		super(HttpStatus.NOT_FOUND, message)
	}
}

export class NoArtistIllustrationException extends NoIllustrationException {
	constructor(artistSlug: Slug) {
		super(`No illustration found for artist '${artistSlug.toString()}'`)
	}
}

export class NoAlbumIllustrationException extends NoIllustrationException {
	constructor(albumSlug: Slug) {
		super(`No illustration found for album '${albumSlug.toString()}'`)
	}
}

export class NoReleaseIllustrationException extends NoIllustrationException {
	constructor(albumSlug: Slug, releaseSlug: Slug) {
		super(`No illustration found for release '${releaseSlug.toString()}' of ${albumSlug.toString()}`)
	}
}

export class CantDownloadIllustrationException extends InvalidRequestException {
	constructor(illustrationURL: string) {
		super(`Illustration from could not be downloaded from '${illustrationURL}'`);
	}
}

export class IllustrationNotExtracted extends InvalidRequestException {
	constructor(trackSourceFileName: string) {
		super(`Illustration from file '${trackSourceFileName}' could not be extracted`);
	}
}