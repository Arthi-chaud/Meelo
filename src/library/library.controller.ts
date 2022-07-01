import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ParseSlugPipe } from 'src/slug/pipe';
import Slug from 'src/slug/slug';
import LibraryService from './library.service';
import { LibraryDto } from './models/library.dto';
import type { Library } from '@prisma/client';

@Controller('libraries')
export default class LibraryController {
	constructor(private libraryService: LibraryService) { }

	@Post('new')
	async createLibrary(@Body() createLibraryDto: LibraryDto) {
		return await this.libraryService.createLibrary(createLibraryDto)
	}

	@Get()
	async getLibraries() {
		return await this.libraryService.getLibraries({});
	}
	
	@Get('scan')
	async scanLibrariesFiles() {
		const libraries = await this.libraryService.getLibraries({});
		libraries.forEach((library) => this.libraryService.registerNewFiles(library));
		return `Scanning ${libraries.length} libraries`
	}

	@Get('clean')
	async cleanLibraries() {
		const libraries = await this.libraryService.getLibraries({});
		libraries.forEach((library) => this.libraryService.unregisterUnavailableFiles(new Slug(library.slug)));
		return `Cleanning ${libraries.length} libraries`;
	}

	@Get(':slug')
	async getLibrary(@Param('slug', ParseSlugPipe) slug: Slug): Promise<Library> {
		return await this.libraryService.getLibrary({ slug: slug });
	}

	@Get('scan/:slug')
	async scanLibraryFiles(@Param('slug', ParseSlugPipe) slug: Slug) {
		let library = await this.getLibrary(slug);
		this.libraryService.registerNewFiles(library);
	}

	@Get('clean/:slug')
	async cleanLibrary(@Param('slug', ParseSlugPipe) slug: Slug) {
		await this.libraryService.unregisterUnavailableFiles(slug);
	}
}
