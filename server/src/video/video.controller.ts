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

import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import Response, { ResponseType } from "src/response/response.decorator";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import SongQueryParameters from "src/song/models/song.query-params";
import { VideoResponseBuilder } from "./models/video.response";
import VideoService from "./video.service";
import { VideoType } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";
import TransformIdentifier from "src/identifier/identifier.transform";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import LibraryService from "src/library/library.service";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import SongService from "src/song/song.service";
import SongGroupQueryParameters from "src/song/models/song-group.query-params";
import Slug from "src/slug/slug";
import { formatIdentifier } from "src/repository/repository.utils";
import VideoQueryParameters from "./models/video.query-parameters";
import Roles from "src/authentication/roles/roles.enum";
import { Role } from "src/authentication/roles/roles.decorators";
import IdentifierParam from "src/identifier/identifier.pipe";
import UpdateVideoDTO from "./models/update-video.dto";

export class Selector {
	@IsEnum(VideoType)
	@IsOptional()
	@ApiPropertyOptional({
		enum: VideoType,
		description: "Filter the videos by type",
	})
	type?: VideoType;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter videos by artist",
	})
	@TransformIdentifier(ArtistService)
	artist?: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter videos by album",
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter videos by library",
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Get related songs",
	})
	@TransformIdentifier(SongService)
	song?: SongQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Search videos using a string token",
	})
	query?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Get related songs ",
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
		description: "The Seed to Sort the items",
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
	@Post(":idOrSlug")
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
		summary: "Get many Videos",
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
