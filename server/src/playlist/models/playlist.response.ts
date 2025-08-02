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

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiProperty, IntersectionType } from "@nestjs/swagger";
import {
	IllustratedResponse,
	IllustrationResponse,
} from "src/illustration/models/illustration.response";
import { Playlist, type PlaylistWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import {
	SongResponse,
	SongResponseBuilder,
} from "src/song/models/song.response";
import type { PlaylistEntryModel } from "./playlist-entry.model";

export class PlaylistEntryResponse extends SongResponse {
	@ApiProperty({
		description: "Unique ID of the entry in the playlist",
	})
	entryId: number;
	@ApiProperty({
		description: "Index of the song in the playlist",
	})
	index: number;
}

@Injectable()
export class PlaylistEntryResponseBuilder extends ResponseBuilderInterceptor<
	PlaylistEntryModel,
	PlaylistEntryResponse
> {
	constructor(
		@Inject(forwardRef(() => SongResponseBuilder))
		private songResponseBuilder: SongResponseBuilder,
	) {
		super();
	}

	returnType = PlaylistEntryResponse;

	async buildResponse(
		entry: PlaylistEntryModel,
	): Promise<PlaylistEntryResponse> {
		return {
			...(await this.songResponseBuilder.buildResponse(entry)),
			entryId: entry.entryId,
			index: entry.index,
		};
	}
}

export class PlaylistResponse extends IntersectionType(
	Playlist,
	IllustratedResponse,
) {}

@Injectable()
export class PlaylistResponseBuilder extends ResponseBuilderInterceptor<
	PlaylistWithRelations,
	PlaylistResponse
> {
	returnType = PlaylistResponse;

	async buildResponse(
		playlist: PlaylistWithRelations,
	): Promise<PlaylistResponse> {
		return {
			id: playlist.id,
			name: playlist.name,
			slug: playlist.slug,
			createdAt: playlist.createdAt,
			isPublic: playlist.isPublic,
			ownerId: playlist.ownerId,
			allowChanges: playlist.allowChanges,
			illustrationId: playlist.illustrationId,
			illustration: playlist.illustration
				? IllustrationResponse.from(playlist.illustration)
				: playlist.illustration,
		};
	}
}
