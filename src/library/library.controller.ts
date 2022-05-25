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
		let newLibrary = await this.libraryService.createLibrary(createLibraryDto).catch(
			() => {
				throw new ConflictException({
					error: "Library already exists"
				});
			}
		);
		return newLibrary;
	}

	@Get()
	async getAllLibraries() {
		return this.libraryService.getAllLibraries();
	}

	@Get(':slug')
	async getLibrary(@Param('slug', ParseSlugPipe) slug: Slug): Promise<Library> {
		return await this.libraryService.getLibrary(slug).catch(
			() => {
				throw new NotFoundException({
					error: "Library not found"
				});
			}
		);
	}

	@Get('scan/:slug')
	async scanLibraryFiles(@Param('slug', ParseSlugPipe) slug: Slug, @Res() res: Response) {
		await this.libraryService.registerNewFiles(
			await this.getLibrary(slug)
		).catch(
			(reason) => {
				throw new HttpException(reason.message, HttpStatus.INTERNAL_SERVER_ERROR);
			}
		);
	}

	@Get('scan')
	async scanLibrariesFiles(@Res() res: Response) {
		(await this.libraryService.getAllLibraries()).forEach(
			(library) => this.libraryService.registerNewFiles(library)
		);
	}

	@Get('clean/:slug')
	async cleanLibrary(@Param('slug', ParseSlugPipe) slug: Slug, @Res() res: Response) {
		await this.libraryService.unregisterUnavailableFiles(
			await this.libraryService.getLibrary(slug, true)
		).catch(
			(reason) => {
				throw new HttpException(reason.message, HttpStatus.INTERNAL_SERVER_ERROR);
			}
		);
	}

}
