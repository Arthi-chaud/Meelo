/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { ApiProperty, IntersectionType } from "@nestjs/swagger";
import { Playlist, PlaylistWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";

import { IllustratedResponse } from "src/illustration/models/illustration.response";
import IllustrationRepository from "src/illustration/illustration.repository";
import SongVersionService from "src/song-version/song-version.service";
import {
	SongVersionResponse,
	SongVersionResponseBuilder,
} from "src/song-version/models/song-version.response";

export class PlaylistEntryResponse extends SongVersionResponse {
	@ApiProperty({
		description: "Unique ID of the entry in the playlist",
	})
	entryId: number;
}

export class PlaylistResponse extends IntersectionType(
	Playlist,
	IllustratedResponse,
	class {
		entries?: PlaylistEntryResponse[];
	},
) {}

@Injectable()
export class PlaylistResponseBuilder extends ResponseBuilderInterceptor<
	PlaylistWithRelations,
	PlaylistResponse
> {
	constructor(
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		@Inject(forwardRef(() => SongVersionResponseBuilder))
		private songVersionResponseBuilder: SongVersionResponseBuilder,
		@Inject(forwardRef(() => SongVersionService))
		private songVersionService: SongVersionService,
	) {
		super();
	}

	returnType = PlaylistResponse;

	async buildResponse(
		playlist: PlaylistWithRelations,
	): Promise<PlaylistResponse> {
		const response = <PlaylistResponse>{
			...playlist,
			illustration:
				await this.illustrationRepository.getPlaylistIllustration({
					id: playlist.id,
				}),
		};

		if (playlist.entries !== undefined) {
			response.entries = await Promise.all(
				playlist.entries
					.sort((entryA, entryB) => entryA.index - entryB.index)
					.map((entry) =>
						this.songVersionService
							.get({ id: entry.songVersionId })
							.then((song) =>
								this.songVersionResponseBuilder.buildResponse(
									song,
								),
							)
							.then((songResponse) => ({
								entryId: entry.id,
								...songResponse,
							})),
					),
			);
		}
		return response;
	}
}
