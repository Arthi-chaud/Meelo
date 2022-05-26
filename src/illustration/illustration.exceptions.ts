import { HttpStatus } from "@nestjs/common"
import { MeeloException } from "src/exceptions/meelo-exception"
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
	constructor(albumSlug: Slug, releaseId: number) {
		super(`No illustration folder found for release '${releaseId}' of ${albumSlug.toString()}`)
	}
}

class NoIllustrationException extends MeeloException {
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
	constructor(albumSlug: Slug, releaseId: number) {
		super(`No illustration found for release '${releaseId}' of ${albumSlug.toString()}`)
	}
}