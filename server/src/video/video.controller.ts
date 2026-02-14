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

import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";
import AlbumService from "src/album/album.service";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import ArtistService from "src/artist/artist.service";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import TransformFilter, {
	EnumFilter,
	Filter,
	TransformEnumFilter,
} from "src/filter/filter";
import IdentifierParam from "src/identifier/identifier.pipe";
import TransformIdentifier from "src/identifier/identifier.transform";
import LibraryService from "src/library/library.service";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { VideoType } from "src/prisma/generated/client";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import { formatIdentifier } from "src/repository/repository.utils";
import Response, { ResponseType } from "src/response/response.decorator";
import Slug from "src/slug/slug";
import type SongQueryParameters from "src/song/models/song.query-params";
import type SongGroupQueryParameters from "src/song/models/song-group.query-params";
import SongService from "src/song/song.service";
import UpdateVideoDTO from "./models/update-video.dto";
import VideoQueryParameters from "./models/video.query-parameters";
import { VideoResponseBuilder } from "./models/video.response";
import VideoService from "./video.service";

export class Selector {
	@IsOptional()
	@TransformEnumFilter(VideoType, {
		description: "Filter videos by type",
	})
	type?: EnumFilter<VideoType>;

	@IsOptional()
	@TransformFilter(ArtistService, {
		description: "Filter videos by artist",
	})
	artist?: Filter<ArtistQueryParameters.WhereInput>;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Get videos by album",
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@TransformFilter(LibraryService, {
		description: "Filter videos by library",
	})
	library?: Filter<LibraryQueryParameters.WhereInput>;

	@IsOptional()
	@TransformFilter(SongService, {
		description: "Filter videos by song",
	})
	song?: Filter<SongQueryParameters.WhereInput>;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Search videos using a string token",
	})
	query?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Get videos of songs from group",
	})
	@TransformIdentifier({
		formatIdentifierToWhereInput: (identifier) =>
			formatIdentifier<SongGroupQueryParameters.WhereInput>(
				identifier,
				(id: string) => ({ slug: new Slug(id) }),
				(id: number) => ({ id: id }),
			),
	})
	group?: SongGroupQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "The seed to sort the items",
	})
	@IsNumber()
	@IsPositive()
	random?: number;
}
@ApiTags("Videos")
@Controller("videos")
export class VideoController {
	constructor(private videoService: VideoService) {}

	@ApiOperation({
		summary: "Get a video",
	})
	@Role(Roles.Default)
	@Response({ handler: VideoResponseBuilder })
	@Get(":idOrSlug")
	async getVideo(
		@RelationIncludeQuery(VideoQueryParameters.AvailableAtomicIncludes)
		include: VideoQueryParameters.RelationInclude,
		@IdentifierParam(VideoService)
		where: VideoQueryParameters.WhereInput,
	) {
		return this.videoService.get(where, include);
	}

	@ApiOperation({
		summary: "Update a video",
	})
	@Response({ handler: VideoResponseBuilder })
	@Put(":idOrSlug")
	@Role(Roles.Default)
	async updateSong(
		@Body() updateDTO: UpdateVideoDTO,
		@IdentifierParam(VideoService)
		where: VideoQueryParameters.WhereInput,
	) {
		const { masterTrackId, ...dtoRest } = updateDTO;
		return this.videoService.update(
			{
				...dtoRest,
				master: masterTrackId ? { id: masterTrackId } : undefined,
			},
			where,
		);
	}

	@ApiOperation({
		summary: "Get many videos",
	})
	@Response({
		handler: VideoResponseBuilder,
		type: ResponseType.Page,
	})
	@Get()
	async getVideos(
		@Query() selector: Selector,
		@Query() sort: VideoQueryParameters.SortingParameter,
		@Query()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(VideoQueryParameters.AvailableAtomicIncludes)
		include: VideoQueryParameters.RelationInclude,
	) {
		if (selector.query) {
			return this.videoService.search(
				decodeURI(selector.query),
				selector,
				paginationParameters,
				include,
			);
		}
		return this.videoService.getMany(
			selector,
			paginationParameters,
			include,
			selector.random ?? sort,
		);
	}
}
