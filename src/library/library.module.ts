import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SequelizeMethod } from 'sequelize/types/utils';
import { Library } from './models/library.model';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Library
		])
	],
	controllers: [LibraryController],
	providers: [LibraryService]
})
export class LibraryModule {}
