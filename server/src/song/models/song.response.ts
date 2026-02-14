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
import { IntersectionType, OmitType } from "@nestjs/swagger";
import {
	type ArtistResponse,
	ArtistResponseBuilder,
} from "src/artist/models/artist.response";
import {
	IllustratedResponse,
	IllustrationResponse,
} from "src/illustration/models/illustration.response";
import {
	LocalIdentifiersResponse,
	ResponseWithLocalIdentifiers,
} from "src/local-identifiers/local-identifiers.response";
import { LyricsResponse } from "src/lyrics/models/lyrics.response";
import { Song, type SongWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import {
	type TrackResponse,
	TrackResponseBuilder,
} from "src/track/models/track.response";
import TrackService from "src/track/track.service";

export class SongResponse extends IntersectionType(
	OmitType(Song, ["sortSlug", "nameSlug"]),
	IllustratedResponse,
	ResponseWithLocalIdentifiers,
	class {
		lyrics?: LyricsResponse | null;
		artist?: ArtistResponse;
		master?: TrackResponse;
		featuring?: ArtistResponse[];
	},
) {}

@Injectable()
export class SongResponseBuilder extends ResponseBuilderInterceptor<
	SongWithRelations,
	SongResponse
> {
	constructor(
		@Inject(forwardRef(() => ArtistResponseBuilder))
		private artistResponseBuilder: ArtistResponseBuilder,
		@Inject(forwardRef(() => TrackResponseBuilder))
		private trackResponseBuilder: TrackResponseBuilder,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
	) {
		super();
	}

	returnType = SongResponse;

	async buildResponse(song: SongWithRelations): Promise<SongResponse> {
		if (song.master === null) {
			song.master = await this.trackService.getSongMasterTrack({
				id: song.id,
			});
		}
		return {
			id: song.id,
			name: song.name,
			slug: song.slug,
			sortName: song.sortName,
			artistId: song.artistId,
			masterId: song.masterId,
			bpm: song.bpm,
			type: song.type,
			registeredAt: song.registeredAt,
			groupId: song.groupId,
			lyrics: song.lyrics as any,
			featuring: song.featuring
				? await Promise.all(
						song.featuring.map((artist) =>
							this.artistResponseBuilder.buildResponse(artist),
						),
					)
				: song.featuring,
			master: song.master
				? await this.trackResponseBuilder.buildResponse(song.master)
				: song.master,
			artist: song.artist
				? await this.artistResponseBuilder.buildResponse(song.artist)
				: song.artist,
			illustration: song.illustration
				? IllustrationResponse.from(song.illustration)
				: song.illustration,

			localIdentifiers: LocalIdentifiersResponse.from(
				song.localIdentifiers,
			),
		};
	}
}
