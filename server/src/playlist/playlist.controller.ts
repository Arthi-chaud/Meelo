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
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
} from "@nestjs/common";
import {
	ApiOperation,
	ApiPropertyOptional,
	ApiTags,
	IntersectionType,
} from "@nestjs/swagger";
import PlaylistService from "./playlist.service";
import PlaylistQueryParameters from "./models/playlist.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import { PlaylistResponseBuilder } from "./models/playlist.response";
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

export class Selector extends IntersectionType(
	PlaylistQueryParameters.SortingParameter,
) {
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
	constructor(private playlistService: PlaylistService) {}

	@ApiOperation({
		summary: "Get one Playlist",
	})
	@Get(":idOrSlug")
	@Response({ handler: PlaylistResponseBuilder })
	async get(
		@RelationIncludeQuery(PlaylistQueryParameters.AvailableAtomicIncludes)
		include: PlaylistQueryParameters.RelationInclude,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
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
		@Query()
		paginationParameters: PaginationParameters,
	) {
		return this.playlistService.getMany(
			selector,
			paginationParameters,
			{},
			selector,
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
			{ id: playlistEntryDTO.songVersionId },
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
}
