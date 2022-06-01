import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Album } from './models/album.model';
import { AlbumService } from './album.service';
import { ArtistModule } from 'src/artist/artist.module';

@Module({
	imports: [
		SequelizeModule.forFeature([Album]),
		ArtistModule
	],
	exports: [AlbumService],
	providers: [AlbumService]
})
export class AlbumModule {}
