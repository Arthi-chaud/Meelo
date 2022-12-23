import {
	Controller, Get, Logger, Param
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import LibraryService from 'src/library/library.service';
import type TaskResponse from './models/task.response';
import TasksService from './tasks.service';
import { Timeout } from '@nestjs/schedule';
import Admin from 'src/roles/admin.decorator';
import { IdentifierParam } from 'src/identifier/models/identifier';

@Admin()
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
	@Timeout(5000)
	@Get('scan')
	async scanLibrariesFiles(): Promise<TaskResponse> {
		const libraries = await this.libraryService.getMany({});

		libraries.forEach((library) => this.tasksService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error)));
		return {
			status: `Scanning ${libraries.length} libraries`
		};
	}

	@ApiOperation({
		summary: 'Scan a library'
	})
	@Get('scan/:idOrSlug')
	async scanLibraryFiles(
		@Param() { idOrSlug }: IdentifierParam
	): Promise<TaskResponse> {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);
		const library = await this.libraryService.get(where);

		this.tasksService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error));
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
			.catch((error) => Logger.error(error)));
		return {
			status: `Cleanning ${libraries.length} libraries`
		};
	}

	@ApiOperation({
		summary: 'Clean a library'
	})
	@Get('clean/:idOrSlug')
	async cleanLibrary(
		@Param() { idOrSlug }: IdentifierParam
	): Promise<TaskResponse> {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);
		const library = await this.libraryService.get(where);

		this.tasksService
			.unregisterUnavailableFiles(where)
			.catch((error) => Logger.error(error));
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
			.catch((error) => Logger.error(error)));
		return {
			status: `Refreshing ${libraries.length} libraries`
		};
	}

	@ApiOperation({
		summary: "Refresh all library's files metadata"
	})
	@Get('refresh-metadata/:idOrSlug')
	async refreshLibraryFilesMetadata(
		@Param() { idOrSlug }: IdentifierParam
	): Promise<TaskResponse> {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);
		const library = await this.libraryService.get(where);

		this.tasksService
			.resyncAllMetadata(where)
			.catch((error) => Logger.error(error));
		return {
			status: `Refreshing metadata of library '${library.slug}'`
		};
	}
}

