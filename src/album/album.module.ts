import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Album } from './models/album.model';

@Module({
	imports: [
		SequelizeModule.forFeature([Album])
	]
})
export class AlbumModule {}
