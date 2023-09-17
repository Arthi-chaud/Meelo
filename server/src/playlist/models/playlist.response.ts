import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { ApiProperty, IntersectionType } from "@nestjs/swagger";
import { Playlist, PlaylistWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import { SongResponse, SongResponseBuilder } from "src/song/models/song.response";
import SongService from "src/song/song.service";
import { IllustratedResponse } from "src/illustration/models/illustration.response";
import IllustrationRepository from "src/illustration/illustration.repository";

export class PlaylistEntryResponse extends SongResponse {
	@ApiProperty({
		description: 'Unique ID of the entry in the playlist'
	})
	entryId: number;
}

export class PlaylistResponse extends IntersectionType(
	Playlist,
	IllustratedResponse,
	class {
		entries?: PlaylistEntryResponse[];
	}
) {}

@Injectable()
export class PlaylistResponseBuilder extends ResponseBuilderInterceptor<PlaylistWithRelations, PlaylistResponse> {
	constructor(
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
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
			illustration: await this.illustrationRepository
				.getPlaylistIllustration({ id: playlist.id })
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
