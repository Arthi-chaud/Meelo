import { Module } from '@nestjs/common';
import LibraryModule from 'src/library/library.module';
import TasksController  from './tasks.controller';

@Module({
	imports: [
		LibraryModule
	],
	controllers: [TasksController],
})
export default class TasksModule {}
