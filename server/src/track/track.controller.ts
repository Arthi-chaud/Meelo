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

import {
	Body,
	Controller,
	Get,
	Inject,
	Post,
	Put,
	Query,
	forwardRef,
} from "@nestjs/common";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import TrackQueryParameters from "./models/track.query-parameters";
import TrackService from "./track.service";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { TrackType } from "@prisma/client";
import { TrackResponseBuilder } from "./models/track.response";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import Admin from "src/authentication/roles/admin.decorator";
import IdentifierParam from "src/identifier/identifier.pipe";
import Response, { ResponseType } from "src/response/response.decorator";
import SongService from "src/song/song.service";
import { IsEnum, IsOptional } from "class-validator";
import TransformIdentifier from "src/identifier/identifier.transform";
import LibraryService from "src/library/library.service";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import SongQueryParameters from "src/song/models/song.query-params";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import ArtistService from "src/artist/artist.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import AlbumService from "src/album/album.service";
import { IllustrationDownloadDto } from "src/illustration/models/illustration-dl.dto";
import IllustrationRepository from "src/illustration/illustration.repository";
import IllustrationService from "src/illustration/illustration.service";
import { IllustrationResponse } from "src/illustration/models/illustration.response";

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
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		private illustrationService: IllustrationService,
		private illustrationRepository: IllustrationRepository,
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
	@Get("master/:idOrSlug")
	async getSongMaster(
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		return this.trackService.getMasterTrack(where, include);
	}

	@ApiOperation({
		summary: "Set a track as master track",
	})
	@Admin()
	@Response({ handler: TrackResponseBuilder })
	@Put(":idOrSlug/master")
	async setAsMaster(
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput,
	) {
		const track = await this.trackService.get(where);

		await this.songService.setMasterTrack(where);
		return track;
	}

	@ApiOperation({
		summary: "Change a track's illustration",
	})
	@Admin()
	@Post(":idOrSlug/illustration")
	async updateTrackIllustration(
		@Body() illustrationDto: IllustrationDownloadDto,
		@IdentifierParam(TrackService)
		where: TrackQueryParameters.WhereInput,
	): Promise<IllustrationResponse> {
		const track = await this.trackService.get(where);
		const buffer = await this.illustrationService.downloadIllustration(
			illustrationDto.url,
		);

		return this.illustrationRepository
			.saveReleaseIllustration(
				buffer,
				track.discIndex,
				track.trackIndex,
				{ id: track.releaseId },
			)
			.then(IllustrationResponse.from);
	}
}
