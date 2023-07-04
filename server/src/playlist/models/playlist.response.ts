import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { ApiProperty, IntersectionType } from "@nestjs/swagger";
import { IllustratedModel } from "src/illustration/models/illustration.response";
import { Playlist, PlaylistWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import { SongResponse, SongResponseBuilder } from "src/song/models/song.response";
import PlaylistIllustrationService from "../playlist-illustration.service";
import SongService from "src/song/song.service";

export class PlaylistEntryResponse extends SongResponse {
	@ApiProperty({
		description: 'Unique ID of the entry in the playlist'
	})
	entryId: number;
}

export class PlaylistResponse extends IntersectionType(
	IntersectionType(
		Playlist, IllustratedModel,
	),
	class {
		entries?: PlaylistEntryResponse[];
	}
) {}

@Injectable()
export class PlaylistResponseBuilder extends ResponseBuilderInterceptor<PlaylistWithRelations, PlaylistResponse> {
	constructor(
		@Inject(forwardRef(() => PlaylistIllustrationService))
		private playlistIllustrationService: PlaylistIllustrationService,
		@Inject(forwardRef(() => SongResponseBuilder))
		private songResponseBuilder: SongResponseBuilder,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
	) {
		super();
	}

	returnType = PlaylistResponse;

	async buildResponse(playlist: PlaylistWithRelations): Promise<PlaylistResponse> {
		const response = <PlaylistResponse>{
			...playlist,
			illustration: this.playlistIllustrationService.buildIllustrationLink(playlist.slug)
		};

		if (playlist.entries !== undefined) {
			response.entries = await Promise.all(
				playlist.entries.sort((entryA, entryB) => entryA.index - entryB.index).map(
					(entry) => this.songService
						.get({ id: entry.songId })
						.then((song) => this.songResponseBuilder.buildResponse(song))
						.then((songResponse) => ({
							entryId: entry.id,
							...songResponse
						}))
				)
			);
		}
		return response;
	}
}
