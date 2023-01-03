import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import LibraryService from 'src/library/library.service';
import type TaskResponse from './models/task.response';
import TasksService from './tasks.service';
import { Timeout } from '@nestjs/schedule';
import Admin from 'src/roles/admin.decorator';
import IdentifierParam from 'src/identifier/identifier.pipe';
import LibraryQueryParameters from 'src/library/models/library.query-parameters';
import Logger from 'src/logger/logger';

@Admin()
@ApiTags('Tasks')
@Controller('tasks')
export default class TasksController {
	private readonly logger = new Logger(TasksController.name);
	constructor(
		private libraryService: LibraryService,
		private tasksService: TasksService,
	) {}

	@ApiOperation({
		summary: 'Scan all libraries'
	})
	@Timeout(5000)
	@Get('scan')
	async scanLibrariesFiles(): Promise<TaskResponse> {
		const libraries = await this.libraryService.getMany({});

		libraries.forEach((library) => this.tasksService
			.registerNewFiles(library)
			.catch((error) => this.logger.error(error)));
		return {
			status: `Scanning ${libraries.length} libraries`
		};
	}

	@ApiOperation({
		summary: 'Scan a library'
	})
	@Get('scan/:idOrSlug')
	async scanLibraryFiles(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	): Promise<TaskResponse> {
		const library = await this.libraryService.get(where);

		this.tasksService
			.registerNewFiles(library)
			.catch((error) => this.logger.error(error));
		return {
			status: `Scanning library '${library.slug}'`
		};
	}

	@ApiOperation({
		summary: 'Clean all libraries'
	})
	@Get('clean')
	async cleanLibraries(): Promise<TaskResponse> {
		const libraries = await this.libraryService.getMany({});

		libraries.forEach((library) => this.tasksService
			.unregisterUnavailableFiles({ id: library.id })
			.catch((error) => this.logger.error(error)));
		return {
			status: `Cleanning ${libraries.length} libraries`
		};
	}

	@ApiOperation({
		summary: 'Clean a library'
	})
	@Get('clean/:idOrSlug')
	async cleanLibrary(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	): Promise<TaskResponse> {
		const library = await this.libraryService.get(where);

		this.tasksService
			.unregisterUnavailableFiles(where)
			.catch((error) => this.logger.error(error));
		return {
			status: `Cleaning library '${library.slug}'`
		};
	}

	@ApiOperation({
		summary: "Refresh all libraries' files metadata"
	})
	@Get('refresh-metadata')
	async refreshLibrariesFilesMetadata(): Promise<TaskResponse> {
		const libraries = await this.libraryService.getMany({});

		libraries.forEach((library) => this.tasksService
			.resyncAllMetadata({ id: library.id })
			.catch((error) => this.logger.error(error)));
		return {
			status: `Refreshing ${libraries.length} libraries`
		};
	}

	@ApiOperation({
		summary: "Refresh all library's files metadata"
	})
	@Get('refresh-metadata/:idOrSlug')
	async refreshLibraryFilesMetadata(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	): Promise<TaskResponse> {
		const library = await this.libraryService.get(where);

		this.tasksService
			.resyncAllMetadata(where)
			.catch((error) => this.logger.error(error));
		return {
			status: `Refreshing metadata of library '${library.slug}'`
		};
	}
}

