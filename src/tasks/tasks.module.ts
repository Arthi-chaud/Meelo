import { Module } from '@nestjs/common';
import TasksService from './tasks.service';
import LibraryModule from 'src/library/library.module';
import TasksController  from './tasks.controller';

@Module({
	imports: [
		LibraryModule
	],
	controllers: [TasksController],
	providers: [TasksService],
	exports: [TasksService]
})
export default class TasksModule {}
