import { Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { ParseSlugPipe } from 'src/slug/pipe';
import Slug from 'src/slug/slug';
import LibraryService from './library.service';
import { LibraryDto } from './models/library.dto';
import type { Library } from '@prisma/client';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import LibraryQueryParameters from './models/library.query-parameters';
import ParseRelationIncludePipe from 'src/relation-include/relation-include.pipe';

const ParseLibraryRelationIncludePipe = new ParseRelationIncludePipe(LibraryQueryParameters.AvailableIncludes);

@Controller('libraries')
export default class LibraryController {
	constructor(private libraryService: LibraryService) { }

	@Post('new')
	async createLibrary(@Body() createLibraryDto: LibraryDto) {
		return await this.libraryService.createLibrary(createLibraryDto);
	}
	@Get()
	async getLibraries(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', ParseLibraryRelationIncludePipe) include: LibraryQueryParameters.RelationInclude
	) {
		return await this.libraryService.getLibraries({}, paginationParameters, include);
	}
		
	@Get('scan')
	async scanLibrariesFiles() {
		const libraries = await this.libraryService.getLibraries({});
		libraries.forEach((library) => this.libraryService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error))
		);
		return `Scanning ${libraries.length} libraries`
	}

	@Get(':slug')
	async getLibrary(
		@Param('slug', ParseSlugPipe) slug: Slug,
		@Query('with', ParseLibraryRelationIncludePipe) include: LibraryQueryParameters.RelationInclude
	): Promise<Library> {
		return await this.libraryService.getLibrary({ slug: slug }, include);
	}

	@Get('clean')
	async cleanLibraries() {
		const libraries = await this.libraryService.getLibraries({});
		libraries.forEach((library) => this.libraryService
			.unregisterUnavailableFiles(new Slug(library.slug))
			.catch((error) => Logger.error(error))
		);
		return `Cleanning ${libraries.length} libraries`;
	}

	@Get('scan/:slug')
	async scanLibraryFiles(@Param('slug', ParseSlugPipe) slug: Slug) {
		let library = await this.libraryService.getLibrary({ slug: slug });
		this.libraryService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error));
	}

	@Get('clean/:slug')
	async cleanLibrary(@Param('slug', ParseSlugPipe) slug: Slug) {
		this.libraryService
			.unregisterUnavailableFiles(slug)
			.catch((error) => Logger.error(error));
	}
}
