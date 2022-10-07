import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import ParseLibraryIdentifierPipe from 'src/library/library.pipe';
import LibraryService from 'src/library/library.service';
import type LibraryQueryParameters from 'src/library/models/library.query-parameters';
import type TaskResponse from './models/task.response';
import TasksService from './tasks.service';

@ApiTags('Tasks')
@Controller('tasks')
export default class TasksController {

	constructor(
		private libraryService: LibraryService,
		private tasksService: TasksService,
	) {}

	@ApiOperation({
		summary: 'Scan all libraries'
	})
	@Get('scan')
	async scanLibrariesFiles(): Promise<TaskResponse> {
		const libraries = await this.libraryService.getMany({});
		libraries.forEach((library) => this.tasksService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error))
		);
		return {
			status: `Scanning ${libraries.length} libraries`
		}
	}

	@ApiOperation({
		summary: 'Scan a library'
	})
	@Get('scan/:idOrSlug')
	async scanLibraryFiles(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput
	): Promise<TaskResponse> {
		let library = await this.libraryService.get(where);
		this.tasksService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error));
		return {
			status: `Scanning library '${library.slug}'`
		}
	}

	@ApiOperation({
		summary: 'Clean all libraries'
	})
	@Get('clean')
	async cleanLibraries(): Promise<TaskResponse> {
		const libraries = await this.libraryService.getMany({});
		libraries.forEach((library) => this.tasksService
			.unregisterUnavailableFiles({ id: library.id })
			.catch((error) => Logger.error(error))
		);
		return {
			status: `Cleanning ${libraries.length} libraries`
		}
	}

	@ApiOperation({
		summary: 'Clean a library'
	})
	@Get('clean/:idOrSlug')
	async cleanLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput
	): Promise<TaskResponse> {
		let library = await this.libraryService.get(where);
		this.tasksService
			.unregisterUnavailableFiles(where)
			.catch((error) => Logger.error(error));
		return {
			status: `Cleaning library '${library.slug}'`
		}
	}


	@ApiOperation({
		summary: "Refresh all libraries' files metadata"
	})
	@Get('refresh-metadata')
	async refreshLibrariesFilesMetadata(): Promise<TaskResponse> {
		const libraries = await this.libraryService.getMany({});
		libraries.forEach((library) => this.tasksService
			.resyncAllMetadata({ id: library.id })
			.catch((error) => Logger.error(error))
		);
		return {
			status: `Refreshing ${libraries.length} libraries`
		}
	}

	@ApiOperation({
		summary: "Refresh all library's files metadata"
	})
	@Get('refresh-metadata/:idOrSlug')
	async refreshLibraryFilesMetadata(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput
	): Promise<TaskResponse> {
		let library = await this.libraryService.get(where);
		this.tasksService
			.resyncAllMetadata(where)
			.catch((error) => Logger.error(error));
		return {
			status: `Refreshing metadata of library '${library.slug}'`
		}
	}
}

