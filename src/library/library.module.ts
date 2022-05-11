import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SequelizeMethod } from 'sequelize/types/utils';
import { Library } from './models/library.model';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Library
		])
	]
})
export class LibraryModule {}
