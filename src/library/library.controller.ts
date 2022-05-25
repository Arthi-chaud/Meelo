import { Body, ConflictException, Controller, Delete, Get, HttpException, HttpStatus, NotFoundException, Param, Post, Res, Response } from '@nestjs/common';
import { ParseSlugPipe } from 'src/slug/pipe';
import { Slug } from 'src/slug/slug';
import { LibraryService } from './library.service';
import { LibraryDto } from './models/library.dto';
import { Library } from './models/library.model';

@Controller('libraries')
export class LibraryController {
	constructor(private libraryService: LibraryService) { }

	@Post('new')
	async createLibrary(@Body() createLibraryDto: LibraryDto) {
		return await this.libraryService.createLibrary(createLibraryDto)
	}

	@Get()
	async getAllLibraries() {
		return await this.libraryService.getAllLibraries();
	}

	@Get(':slug')
	async getLibrary(@Param('slug', ParseSlugPipe) slug: Slug): Promise<Library> {
		return await this.libraryService.getLibrary(slug);
	}

	@Get('scan/:slug')
	async scanLibraryFiles(@Param('slug', ParseSlugPipe) slug: Slug) {
		await this.libraryService.registerNewFiles(await this.getLibrary(slug));
	}

	@Get('scan')
	async scanLibrariesFiles(@Res() res: Response) {
		(await this.libraryService.getAllLibraries()).forEach(
			(library) => this.libraryService.registerNewFiles(library)
		);
	}

	@Get('clean/:slug')
	async cleanLibrary(@Param('slug', ParseSlugPipe) slug: Slug) {
		await this.libraryService.unregisterUnavailableFiles(
			await this.libraryService.getLibrary(slug, true)
		);
	}

}
