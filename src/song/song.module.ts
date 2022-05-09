import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Song } from './models/song.model';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Song,
		])
	]
})
export class SongModule {}
