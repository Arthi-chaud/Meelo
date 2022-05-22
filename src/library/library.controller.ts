import { Body, Controller, Delete, Get, HttpException, HttpStatus, NotFoundException, Param, Post, Res } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryDto } from './models/library.dto';
import { Library } from './models/library.model';

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
	async getLibrary(@Param('slug') slug: string): Promise<Library> {
		return await this.libraryService.getLibrary(slug).catch(
			() => {
				throw new NotFoundException({
					error: "Library not found"
				});
			}
		);
	}

	@Get('scan/:slug')
	async scanLibraryFiles(@Param('slug') slug: string, @Res() res) {
		await this.libraryService.registerNewFiles(
			await this.getLibrary(slug)
		).catch(
			(reason) => {
				res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
			}
		);
		res.status(HttpStatus.OK).send();
	}

	@Get('scan')
	async scanLibrariesFiles(@Res() res) {
		(await this.libraryService.getAllLibraries()).forEach(
			(library) => this.libraryService.registerNewFiles(library)
		);
		res.status(HttpStatus.OK).send();
	}

	@Get('clean/:slug')
	async cleanLibrary(@Param('slug') slug: string, @Res() res) {
		await this.libraryService.unregisterUnavailableFiles(
			await this.libraryService.getLibrary(slug, true)
		).catch(
			(reason) => {
				res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
			}
		);
		res.status(HttpStatus.OK).send();
	}

}
