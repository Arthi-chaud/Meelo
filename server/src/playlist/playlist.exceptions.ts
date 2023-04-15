import { NotFoundException } from "@nestjs/common";
import Slug from "src/slug/slug";

export class PlaylistNotFoundException extends NotFoundException {
	constructor(playlistSlug: Slug) {
		super(`Playlist ${playlistSlug}: Playlist not found`);
	}
}

export class PlaylistAlreadyExistsException extends NotFoundException {
	constructor(playlistName: string) {
		super(`Playlist '${playlistName}': Playlist already exists`);
	}
}

export class PlaylistNotFoundFromIDException extends NotFoundException {
	constructor(id: number) {
		super(`Playlist ${id} not found`);
	}
}

export class AddSongToPlaylistFailureException extends NotFoundException {
	constructor() {
		super(`Adding Song to playlist failed`);
	}
}

export class PlaylistEntryNotFoundException extends NotFoundException {
	constructor(entryId: number) {
		super(`Playlist entry ${entryId} not found`);
	}
}
