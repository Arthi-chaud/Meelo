import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryDto } from './models/library.dto';

@Controller('libraries')
export class LibraryController {
	constructor(private libraryService: LibraryService) {}
	
	@Post('new')
	async createLibrary(@Body() createLibraryDto: LibraryDto) {
		this.libraryService.createLibrary(createLibraryDto);
	}

	@Get('all')
	async getAllLibraries() {
		return this.libraryService.getAllLibraries();
	}

	@Get(':name')
	async getLibrary(name : string) {
		return this.libraryService.getLibrary(name);
	}
}
