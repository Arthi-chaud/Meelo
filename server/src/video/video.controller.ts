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

import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import Response, { ResponseType } from "src/response/response.decorator";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import SongQueryParameters from "src/song/models/song.query-params";
import { VideoResponseBuilder } from "./models/video.response";
import { Selector } from "src/song/song.controller";
import VideoService from "./video.service";

@ApiTags("Videos")
@Controller("videos")
export class VideoController {
	constructor(private videoService: VideoService) {}

	@ApiOperation({
		summary: "Get many Videos (Song with video track)",
	})
	@Response({
		handler: VideoResponseBuilder,
		type: ResponseType.Page,
	})
	@Get()
	async getVideosByLibrary(
		@Query() selector: Selector,
		@Query()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
	) {
		return this.videoService.getVideos(
			selector,
			paginationParameters,
			include,
			selector,
		);
	}
}
