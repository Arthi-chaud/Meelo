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
