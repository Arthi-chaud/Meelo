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

import { Controller, Get, Inject, Query, forwardRef } from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { TrackType } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
import AlbumService from "src/album/album.service";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import ArtistService from "src/artist/artist.service";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import TransformIdentifier from "src/identifier/identifier.transform";
import LibraryService from "src/library/library.service";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import Response, { ResponseType } from "src/response/response.decorator";
import type SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import type VideoQueryParameters from "src/video/models/video.query-parameters";
import VideoService from "src/video/video.service";
import TrackQueryParameters from "./models/track.query-parameters";
import { TrackResponseBuilder } from "./models/track.response";
import TrackService from "./track.service";

class Selector {
	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter tracks by library",
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter tracks by release",
	})
	@TransformIdentifier(ReleaseService)
	release?: ReleaseQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter tracks by song",
	})
	@TransformIdentifier(SongService)
	song?: SongQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter tracks by video",
	})
	@TransformIdentifier(VideoService)
	video?: VideoQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		enum: TrackType,
		description: "Filter tracks by type",
	})
	@IsEnum(TrackType)
	type?: TrackType;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter tracks by artist",
	})
	@TransformIdentifier(ArtistService)
	artist?: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter tracks by album",
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;
}

@ApiTags("Tracks")
@Controller("tracks")
export class TrackController {
	constructor(
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
	) {}

	@ApiOperation({
		summary: "Get many tracks",
	})
	@Get()
	@Response({
		handler: TrackResponseBuilder,
		type: ResponseType.Page,
	})
	async getMany(
		@Query() selector: Selector,
		@Query() sort: TrackQueryParameters.SortingParameter,
		@Query()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
	) {
		return this.trackService.getMany(
			selector,
			sort,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Get a track",
	})
	@Response({ handler: TrackResponseBuilder })
	@Get(":idOrSlug")
	async get(
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput,
	) {
		return this.trackService.get(where, include);
	}

	@ApiOperation({
		summary: "Get a song's master track",
	})
	@Response({ handler: TrackResponseBuilder })
	@Get("master/song/:idOrSlug")
	async getSongMaster(
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		return this.trackService.getSongMasterTrack(where, include);
	}

	@ApiOperation({
		summary: "Get a video's master track",
	})
	@Response({ handler: TrackResponseBuilder })
	@Get("master/video/:idOrSlug")
	async getVideoMaster(
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		return this.trackService.getVideoMasterTrack(where, include);
	}
}
