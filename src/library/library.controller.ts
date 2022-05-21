import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryDto } from './models/library.dto';

@Controller('libraries')
export class LibraryController {
	constructor(private libraryService: LibraryService) {}
	
	@Post('new')
	async createLibrary(@Body() createLibraryDto: LibraryDto) {
		this.libraryService.createLibrary(createLibraryDto);
	}

	async getAllLibraries() {
		return this.libraryService.getAllLibraries();
	}

	@Get(':name')
	async getLibrary(@Param('name') name: string) {
		return this.libraryService.getLibrary(name);
	}

	@Get('scan/:name')
	async scanLibraryFiles(@Param('name') name: string) {
		this.libraryService.registerNewFiles(
			await this.getLibrary(name)
		);
	}

	@Get('scan')
	async scanLibrariesFiles(@Param('name') name: string) {
		(await this.libraryService.getAllLibraries()).forEach(
			(library) => this.libraryService.registerNewFiles(library)
		);
	}

}
