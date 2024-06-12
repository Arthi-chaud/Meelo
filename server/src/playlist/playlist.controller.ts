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
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
	forwardRef,
} from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import PlaylistService from "./playlist.service";
import PlaylistQueryParameters from "./models/playlist.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import {
	PlaylistEntryResponseBuilder,
	PlaylistResponseBuilder,
} from "./models/playlist.response";
import Response, { ResponseType } from "src/response/response.decorator";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import {
	CreatePlaylistDTO,
	CreatePlaylistEntryDTO,
	ReorderPlaylistDTO,
	UpdatePlaylistDTO,
} from "./models/playlist.dto";
import { IsOptional } from "class-validator";
import TransformIdentifier from "src/identifier/identifier.transform";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import Admin from "src/authentication/roles/admin.decorator";
import { IllustrationDownloadDto } from "src/illustration/models/illustration-dl.dto";
import IllustrationRepository from "src/illustration/illustration.repository";
import IllustrationService from "src/illustration/illustration.service";
import { IllustrationResponse } from "src/illustration/models/illustration.response";
import SongQueryParameters from "src/song/models/song.query-params";

export class Selector {
	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter playlist by albums that entries belong to",
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;
}

@Controller("playlists")
@ApiTags("Playlists")
export default class PlaylistController {
	constructor(
		private playlistService: PlaylistService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
	) {}

	@ApiOperation({
		summary: "Get one Playlist",
	})
	@Get(":idOrSlug")
	@Response({ handler: PlaylistResponseBuilder })
	async get(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@RelationIncludeQuery(PlaylistQueryParameters.AvailableAtomicIncludes)
		include: PlaylistQueryParameters.RelationInclude,
	) {
		return this.playlistService.get(where, include);
	}

	@ApiOperation({
		summary: "Get Playlists",
	})
	@Get()
	@Response({ handler: PlaylistResponseBuilder, type: ResponseType.Page })
	async getMany(
		@Query() selector: Selector,
		@Query() sort: PlaylistQueryParameters.SortingParameter,
		@RelationIncludeQuery(PlaylistQueryParameters.AvailableAtomicIncludes)
		include: PlaylistQueryParameters.RelationInclude,
		@Query()
		paginationParameters: PaginationParameters,
	) {
		return this.playlistService.getMany(
			selector,
			sort,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Get Playlist's entries",
	})
	@Get(":idOrSlug/entries")
	@Response({
		handler: PlaylistEntryResponseBuilder,
		type: ResponseType.Page,
	})
	async getEntries(
		@Query()
		paginationParameters: PaginationParameters,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
	) {
		return this.playlistService.getEntries(
			where,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Create Playlist",
	})
	@Post("new")
	@Response({ handler: PlaylistResponseBuilder })
	async createPlaylist(
		@Body()
		creationDto: CreatePlaylistDTO,
	) {
		return this.playlistService.create(creationDto);
	}

	@ApiOperation({
		summary: "Update Playlist",
	})
	@Put(":idOrSlug")
	@Response({ handler: PlaylistResponseBuilder })
	async updatePlaylist(
		@Body()
		updateDto: UpdatePlaylistDTO,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
	) {
		return this.playlistService.update(updateDto, where);
	}

	@ApiOperation({
		summary: "Get one Playlist",
	})
	@Delete(":idOrSlug")
	async delete(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
	) {
		await this.playlistService.delete(where);
	}

	@ApiOperation({
		summary: "Add Song to Playlist",
	})
	@Post("entries/new")
	async addSongToPlaylist(
		@Body()
		playlistEntryDTO: CreatePlaylistEntryDTO,
	) {
		await this.playlistService.addSong(
			{ id: playlistEntryDTO.songId },
			{ id: playlistEntryDTO.playlistId },
		);
	}

	@ApiOperation({
		summary: "Reorder Entries in Playlist",
	})
	@Put(":idOrSlug/reorder")
	async moveEntryInPlaylist(
		@Body()
		{ entryIds }: ReorderPlaylistDTO,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
	) {
		await this.playlistService.reorderPlaylist(where, entryIds);
	}

	@ApiOperation({
		summary: "Delete Entry in Playlist",
	})
	@Delete("entries/:id")
	async deleteEntryInPlaylist(
		@Param("id", new ParseIntPipe())
		entryId: number,
	) {
		await this.playlistService.removeEntry(entryId);
	}

	@ApiOperation({
		summary: "Change a playlist's illustration",
	})
	@Admin()
	@Post(":idOrSlug/illustration")
	async updatePlaylistIllustration(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@Body() illustrationDto: IllustrationDownloadDto,
	): Promise<IllustrationResponse> {
		const buffer = await this.illustrationService.downloadIllustration(
			illustrationDto.url,
		);

		return this.illustrationRepository
			.savePlaylistIllustration(buffer, where)
			.then(IllustrationResponse.from);
	}
}
