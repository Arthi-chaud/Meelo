import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { AlbumResponse, AlbumResponseBuilder } from "src/album/models/album.response";
import { ArtistResponse, ArtistResponseBuilder } from "src/artist/models/artist.response";
import { ReleaseResponse, ReleaseResponseBuilder } from "src/release/models/release.response";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import { SongResponse, SongResponseBuilder } from "src/song/models/song.response";
import SearchController from "../search.controller";
import { Genre } from "src/prisma/models";

export type SearchAllReturnType = Awaited<ReturnType<SearchController['searchItems']>>;

export class SearchAllResponse {
	@ApiProperty({
		isArray: true,
		type: () => ArtistResponse
	})
	artists: ArtistResponse[];

	@ApiProperty({
		isArray: true,
		type: () => AlbumResponse
	})
	albums: AlbumResponse[];

	@ApiProperty({
		isArray: true,
		type: () => ReleaseResponse
	})
	releases: ReleaseResponse[];

	@ApiProperty({
		isArray: true,
		type: () => SongResponse
	})
	songs: SongResponse[];

	@ApiProperty({
		isArray: true,
		type: () => Genre
	})
	genres: Genre[];
}

@Injectable()
export class SearchAllResponseBuilder extends ResponseBuilderInterceptor<SearchAllReturnType, SearchAllResponse> {
	constructor(
		private artistResponseBuilder: ArtistResponseBuilder,
		private albumResponseBuilder: AlbumResponseBuilder,
		private songResponseBuilder: SongResponseBuilder,
		private releaseResponseBuilder: ReleaseResponseBuilder
	) {
		super();
	}

	returnType = SearchAllResponse;

	async buildResponse(input: SearchAllReturnType): Promise<SearchAllResponse> {
		return {
			artists: await Promise.all(input.artists.map(this.artistResponseBuilder.buildResponse)),
			albums: await Promise.all(input.albums.map(this.albumResponseBuilder.buildResponse)),
			releases: await Promise.all(input.releases.map(
				this.releaseResponseBuilder.buildResponse
			)),
			songs: await Promise.all(input.songs.map(this.songResponseBuilder.buildResponse)),
			genres: input.genres,
		};
	}
}
