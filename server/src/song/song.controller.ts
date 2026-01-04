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
	forwardRef,
	Get,
	Inject,
	Post,
	Put,
	Query,
	Req,
} from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { SongType, type User } from "src/prisma/generated/client";
import { IsNumber, IsOptional, IsPositive } from "class-validator";
import AlbumService from "src/album/album.service";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import ArtistService from "src/artist/artist.service";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { UnauthorizedAnonymousRequestException } from "src/authentication/authentication.exception";
import { Admin, Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import TransformFilter, {
	EnumFilter,
	Filter,
	TransformEnumFilter,
} from "src/filter/filter";
import GenreService from "src/genre/genre.service";
import type GenreQueryParameters from "src/genre/models/genre.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import TransformIdentifier from "src/identifier/identifier.transform";
import LibraryService from "src/library/library.service";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import { LyricsService } from "src/lyrics/lyrics.service";
import type { LyricsResponse } from "src/lyrics/models/lyrics.response";
import LyricsDto from "src/lyrics/models/update-lyrics.dto";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import { formatIdentifier } from "src/repository/repository.utils";
import Response, { ResponseType } from "src/response/response.decorator";
import Slug from "src/slug/slug";
import MergeSongDTO from "./models/merge-song.dto";
import SongQueryParameters from "./models/song.query-params";
import { SongResponseBuilder } from "./models/song.response";
import type SongGroupQueryParameters from "./models/song-group.query-params";
import UpdateSongDTO from "./models/update-song.dto";
import SongService from "./song.service";

export class Selector {
	@IsOptional()
	@TransformEnumFilter(SongType, {
		description: "Filter the songs by type",
	})
	type?: EnumFilter<SongType>;

	@IsOptional()
	@TransformFilter(ArtistService, {
		description: "Filter songs by artist",
	})
	artist?: Filter<ArtistQueryParameters.WhereInput>;

	@IsOptional()
	@TransformFilter(AlbumService, {
		description: "Filter songs by album",
	})
	album?: Filter<AlbumQueryParameters.WhereInput>;

	@IsOptional()
	@TransformFilter(LibraryService, { description: "Filter songs by library" })
	library?: Filter<LibraryQueryParameters.WhereInput>;

	@IsOptional()
	@TransformFilter(SongService, {
		description: "Get other versions of the song",
	})
	versionsOf?: Filter<SongQueryParameters.WhereInput>;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter songs by group",
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
	@TransformFilter(GenreService, {
		description: "Filter songs by genre",
	})
	genre?: Filter<GenreQueryParameters.WhereInput>;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Search songs using a string token",
	})
	query?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description:
			"Filter songs that are B-Sides of a release. The release must be a studio recording, otherwise returns an  emtpy list",
	})
	@TransformIdentifier(ReleaseService)
	bsides: ReleaseQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description:
			"Filter songs that would be considered to be 'rare' by artist",
	})
	@TransformIdentifier(ArtistService)
	rare: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "The seed to sort the items",
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
		}
		if (selector.bsides) {
			return this.songService.getReleaseBSides(
				selector.bsides,
				paginationParameters,
				include,
				sort,
			);
		}
		if (selector.rare) {
			return this.songService.getRareSongsByArtist(
				selector.rare,
				paginationParameters,
				include,
				sort,
			);
		}

		if (sort.sortBy === "userPlayCount" && !request.user) {
			throw new UnauthorizedAnonymousRequestException();
		}
		return this.songService.getMany(
			{
				...selector,
				playedBy:
					sort.sortBy === "userPlayCount" && request.user
						? { id: (request.user as User).id }
						: undefined,
			},
			selector.random ?? sort,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Get a song",
	})
	@Role(Roles.Default, Roles.Microservice)
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
	@Put(":idOrSlug")
	@Role(Roles.Default, Roles.Microservice)
	async updateSong(
		@Body() updateDTO: UpdateSongDTO,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		const { masterTrackId, ...dtoRest } = updateDTO;
		return this.songService.update(
			{
				...dtoRest,
				master: masterTrackId ? { id: masterTrackId } : undefined,
			},
			where,
		);
	}

	@ApiOperation({
		summary: "Merge a song with another",
		description:
			"All the tracks of the song will be moved to the song whose ID is given in the DTO",
	})
	@Post(":idOrSlug/merge")
	@Role(Roles.Default, Roles.Microservice)
	async mergeSong(
		@Body() updateDTO: MergeSongDTO,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	): Promise<void> {
		await this.songService.merge(where, { id: updateDTO.songId });
	}

	@ApiOperation({
		summary: "Increment a song's play count",
	})
	@Role(Roles.User)
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
		return this.lyricsService.get({ songId: song.id });
	}

	@ApiOperation({
		summary: "Update a song's lyrics",
	})
	@Role(Roles.Admin, Roles.Microservice)
	@Post(":idOrSlug/lyrics")
	async updateSongLyrics(
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
		@Body() updateLyricsDto: LyricsDto,
	): Promise<LyricsResponse> {
		const song = await this.songService.get(where);

		return this.lyricsService.createOrUpdate({
			plain: updateLyricsDto.plain,
			synced: updateLyricsDto.synced,
			songId: song.id,
		});
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
