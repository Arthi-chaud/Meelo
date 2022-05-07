import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { File } from './models/file.model';

@Module({
	imports: [
		SequelizeModule.forFeature([File]),
	]
})
export class FileModule {}
