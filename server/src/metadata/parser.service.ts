import { Injectable } from "@nestjs/common";
import Metadata from "./models/metadata";

@Injectable()
export default class ParserService {
	constructor() {}

	extractArtist(fileMetadata: Metadata): Metadata {
		return fileMetadata;
	}

	/**
	 * Extracts from the song name, and return the '(feat. ...)' segment
	 * @param songName the name of the song, as from the source file's metadata
	 * @example A (feat. B) => [A, [B]]
	 */
	extractFeaturedArtistsFromSongName(_songName: string): Pick<Metadata, 'name' | 'featuring'> {
		return '' as any;
	}

	/**
	 * @example "A & B" => [A, B]
	 * @param artistName the artist of the song, as from the source file's metadata
	 */
	extractFeaturedArtistsFromArtistName(_artistName: string): Pick<Metadata, 'artist' | 'featuring'> {
		return '' as any;
	}
}
