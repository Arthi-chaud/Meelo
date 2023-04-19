import {
	Body,
	Controller, Delete, Get, Param, ParseIntPipe, Post, Put
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import PlaylistService from './playlist.service';
import PlaylistQueryParameters from './models/playlist.query-parameters';
import IdentifierParam from 'src/identifier/identifier.pipe';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import { PlaylistResponseBuilder } from './models/playlist.response';
import Response, { ResponseType } from 'src/response/response.decorator';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import {
	CreatePlaylistDTO, CreatePlaylistEntryDTO,
	ReorderPlaylistDTO, UpdatePlaylistDTO
} from './models/playlist.dto';

@Controller('playlists')
@ApiTags('Playlists')
export default class PlaylistController {
	constructor(
		private playlistService: PlaylistService
	) {}

	@ApiOperation({
		summary: 'Get one Playlist'
	})
	@Get(':idOrSlug')
	@Response({ handler: PlaylistResponseBuilder })
	async get(
		@RelationIncludeQuery(PlaylistQueryParameters.AvailableAtomicIncludes)
		include: PlaylistQueryParameters.RelationInclude,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
	) {
		return this.playlistService.get(
			where,
			include
		);
	}

	@ApiOperation({
		summary: 'Get Playlists'
	})
	@Get()
	@Response({ handler: PlaylistResponseBuilder, type: ResponseType.Page })
	async getMany(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(PlaylistQueryParameters.SortingKeys)
		sortingParameter: PlaylistQueryParameters.SortingParameter,
	) {
		return this.playlistService.getMany(
			{},
			paginationParameters,
			{},
			sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Create Playlist'
	})
	@Post('new')
	@Response({ handler: PlaylistResponseBuilder })
	async createPlaylist(
		@Body()
		creationDto: CreatePlaylistDTO,
	) {
		return this.playlistService.create(
			creationDto
		);
	}

	@ApiOperation({
		summary: 'Update Playlist'
	})
	@Put(':idOrSlug')
	@Response({ handler: PlaylistResponseBuilder })
	async updatePlaylist(
		@Body()
		updateDto: UpdatePlaylistDTO,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
	) {
		return this.playlistService.update(
			updateDto, where
		);
	}

	@ApiOperation({
		summary: 'Get one Playlist'
	})
	@Delete(':idOrSlug')
	async delete(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
	) {
		await this.playlistService.delete(where);
	}

	@ApiOperation({
		summary: 'Add Song to Playlist'
	})
	@Post('entries/new')
	async addSongToPlaylist(
		@Body()
		playlistEntryDTO: CreatePlaylistEntryDTO
	) {
		await this.playlistService.addSong(
			{ id: playlistEntryDTO.songId },
			{ id: playlistEntryDTO.playlistId }
		);
	}

	@ApiOperation({
		summary: 'Reorder Entries in Playlist'
	})
	@Put(':idOrSlug/reorder')
	async moveEntryInPlaylist(
		@Body()
		{ entryIds }: ReorderPlaylistDTO,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
	) {
		await this.playlistService.reorderPlaylist(
			where, entryIds
		);
	}

	@ApiOperation({
		summary: 'Delete Entry in Playlist'
	})
	@Delete('entries/:id')
	async deleteEntryInPlaylist(
		@Param('id', new ParseIntPipe())
		entryId: number
	) {
		await this.playlistService.removeEntry(
			entryId
		);
	}
}
