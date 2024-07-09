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
	Delete,
	Get,
	Inject,
	Post,
	Put,
	Query,
	Req,
	forwardRef,
} from "@nestjs/common";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import SongQueryParameters from "./models/song.query-params";
import SongService from "./song.service";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { LyricsService } from "src/lyrics/lyrics.service";
import LyricsDto from "src/lyrics/models/update-lyrics.dto";
import { SongResponseBuilder } from "./models/song.response";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import Admin from "src/authentication/roles/admin.decorator";
import IdentifierParam from "src/identifier/identifier.pipe";
import Response, { ResponseType } from "src/response/response.decorator";
import { IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";
import TransformIdentifier from "src/identifier/identifier.transform";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import LibraryService from "src/library/library.service";
import GenreQueryParameters from "src/genre/models/genre.query-parameters";
import GenreService from "src/genre/genre.service";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import { SongType, User } from "@prisma/client";
import UpdateSongDTO from "./models/update-song.dto";
import SongGroupQueryParameters from "./models/song-group.query-params";
import { LyricsResponse } from "src/lyrics/models/lyrics.response";
import { formatIdentifier } from "src/repository/repository.utils";
import Slug from "src/slug/slug";

export class Selector {
	@IsEnum(SongType)
	@IsOptional()
	@ApiPropertyOptional({
		enum: SongType,
		description: "Filter the songs by type",
	})
	type?: SongType;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter songs by artist",
	})
	@TransformIdentifier(ArtistService)
	artist?: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter songs by album",
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter songs by library",
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Get related songs ",
	})
	@TransformIdentifier(SongService)
	versionsOf?: SongQueryParameters.WhereInput;

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
		description: "Filter songs by genre",
	})
	@TransformIdentifier(GenreService)
	genre?: GenreQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Search songs using a string token",
	})
	query?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description:
			"Filter songs that are B-Sides of a release.\nThe release must be a studio recording, otherwise returns an  emtpy list",
	})
	@TransformIdentifier(ReleaseService)
	bsides: ReleaseQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter songs that would be considered to be 'rare'",
	})
	@TransformIdentifier(ReleaseService)
	rare: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "The Seed to Sort the items",
	})
	@IsNumber()
	@IsPositive()
	random?: number;
}

@ApiTags("Songs")
@Controller("songs")
export class SongController {
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => LyricsService))
		private lyricsService: LyricsService,
	) {}

	@ApiOperation({
		summary: "Get many songs",
	})
	@Response({
		handler: SongResponseBuilder,
		type: ResponseType.Page,
	})
	@Get()
	async getSongs(
		@Query() selector: Selector,
		@Query() sort: SongQueryParameters.SortingParameter,
		@Query()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@Req() request: Express.Request,
	) {
		if (selector.query) {
			return this.songService.search(
				decodeURI(selector.query),
				selector,
				paginationParameters,
				include,
			);
		} else if (sort.sortBy == "userPlayCount") {
			return this.songService.getManyByPlayCount(
				(request.user as User).id,
				selector,
				paginationParameters,
				include,
				sort.order,
			);
		} else if (selector.bsides) {
			return this.songService.getReleaseBSides(
				selector.bsides,
				paginationParameters,
				include,
				sort,
			);
		} else if (selector.rare) {
			return this.songService.getRareSongsByArtist(
				selector.rare,
				paginationParameters,
				include,
				sort,
			);
		}
		return this.songService.getMany(
			selector,
			selector.random ?? sort,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Get a song",
	})
	@Response({ handler: SongResponseBuilder })
	@Get(":idOrSlug")
	async getSong(
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		return this.songService.get(where, include);
	}

	@ApiOperation({
		summary: "Update a song",
	})
	@Response({ handler: SongResponseBuilder })
	@Post(":idOrSlug")
	async updateSong(
		@Body() updateDTO: UpdateSongDTO,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		return this.songService.update(updateDTO, where);
	}

	@ApiOperation({
		summary: "Increment a song's play count",
	})
	@Response({ handler: SongResponseBuilder })
	@Put(":idOrSlug/played")
	async incrementSongPlayCount(
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
		@Req() request: Express.Request,
	) {
		await this.songService.incrementPlayCount(
			(request.user as User).id,
			where,
		);
		return this.songService.get(where);
	}

	@ApiOperation({
		summary: "Get a song's lyrics",
	})
	@Get(":idOrSlug/lyrics")
	async getSongLyrics(
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	): Promise<LyricsResponse> {
		const song = await this.songService.get(where);
		return this.lyricsService
			.get({ songId: song.id })
			.then(({ content }) => ({ lyrics: content }));
	}

	@ApiOperation({
		summary: "Update a song's lyrics",
	})
	@Admin()
	@Post(":idOrSlug/lyrics")
	async updateSongLyrics(
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
		@Body() updateLyricsDto: LyricsDto,
	): Promise<LyricsResponse> {
		const song = await this.songService.get(where);

		return this.lyricsService
			.createOrUpdate({
				content: updateLyricsDto.lyrics,
				songId: song.id,
			})
			.then(({ content }) => ({ lyrics: content }));
	}

	@ApiOperation({
		summary: "Delete a song's lyrics",
	})
	@Admin()
	@Delete(":idOrSlug/lyrics")
	async deleteSongLyrics(
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	): Promise<void> {
		const song = await this.songService.get(where);

		await this.lyricsService.delete({ songId: song.id });
	}
}
