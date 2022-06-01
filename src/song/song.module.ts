import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ArtistModule } from 'src/artist/artist.module';
import { Song } from './models/song.model';
import { SongService } from './song.service';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Song,
		]),
		ArtistModule
	],
	exports: [SongService],
	providers: [SongService]
})
export class SongModule {}
