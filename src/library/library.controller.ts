import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryDto } from './models/library.dto';

@Controller('libraries')
export class LibraryController {
	constructor(private libraryService: LibraryService) {}
	
	@Post('new')
	async createLibrary(@Body() createLibraryDto: LibraryDto) {
		let newLibrary = await this.libraryService.createLibrary(createLibraryDto).catch(
			(reason) => {
				throw new HttpException({
					message: reason.message
				}, HttpStatus.CONFLICT);
			}
		);
		return newLibrary;
	}

	@Get()
	async getAllLibraries() {
		return this.libraryService.getAllLibraries();
	}

	@Get(':slug')
	async getLibrary(@Param('slug') slug: string) {
		return this.libraryService.getLibrary(slug);
	}

	@Get('scan/:slug')
	async scanLibraryFiles(@Param('slug') slug: string) {
		this.libraryService.registerNewFiles(
			await this.getLibrary(slug)
		);
	}

	@Get('scan')
	async scanLibrariesFiles() {
		(await this.libraryService.getAllLibraries()).forEach(
			(library) => this.libraryService.registerNewFiles(library)
		);
	}

}
