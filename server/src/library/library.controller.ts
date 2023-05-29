import {
	Body, Controller, Delete, Get,
	Post, Put
} from '@nestjs/common';
import LibraryService from './library.service';
import { Library } from 'src/prisma/models';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import LibraryQueryParameters from './models/library.query-parameters';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Admin from 'src/roles/admin.decorator';
import UpdateLibraryDto from './models/update-library.dto';
import CreateLibraryDto from './models/create-library.dto';
import IdentifierParam from 'src/identifier/identifier.pipe';
import Response, { ResponseType } from 'src/response/response.decorator';
import { SongWithVideoResponseBuilder } from 'src/song/models/song-with-video.response';
import SongService from 'src/song/song.service';

@ApiTags("Libraries")
@Controller('libraries')
export default class LibraryController {
	constructor(
		private libraryService: LibraryService,
		private songService: SongService,
	) { }

	@ApiOperation({
		summary: 'Create a new library'
	})
	@Response({
		returns: Library
	})
	@Admin()
	@Post('new')
	async createLibrary(@Body() createLibraryDto: CreateLibraryDto) {
		return this.libraryService.create(createLibraryDto);
	}

	@ApiOperation({
		summary: 'Get a library'
	})
	@Get(':idOrSlug')
	async getLibrary(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	): Promise<Library> {
		return this.libraryService.get(where);
	}

	@ApiOperation({
		summary: 'Update a library'
	})
	@Admin()
	@Put(':idOrSlug')
	async updateLibrary(
		@Body() updateLibraryDTO: UpdateLibraryDto,
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput,
	): Promise<Library> {
		return this.libraryService.update(updateLibraryDTO, where);
	}

	@ApiOperation({
		summary: 'Get all libraries'
	})
	@Get()
	@Response({
		returns: Library,
		type: ResponseType.Page
	})
	async getLibraries(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(LibraryQueryParameters.SortingKeys)
		sortingParameter: LibraryQueryParameters.SortingParameter,
	) {
		return this.libraryService.getMany(
			{}, paginationParameters, {}, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Delete a library'
	})
	@Admin()
	@Delete(':idOrSlug')
	async deleteLibrary(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput,
	) {
		const library = await this.libraryService.get(where);

		this.libraryService.delete(where);
		return library;
	}

	@ApiOperation({
		summary: 'Get all songs with at least one video from a library.'
	})
	@Response({
		handler: SongWithVideoResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/videos')
	async getVideosByLibrary(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	) {
		const songs = await this.songService.getSongsWithVideo(
			{ library: where }, paginationParameters, include, sortingParameter
		);

		if (songs.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return songs;
	}
}
