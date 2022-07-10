import { Module, forwardRef } from '@nestjs/common';
import ArtistService from './artist.service';
import PrismaModule from 'src/prisma/prisma.module';
import ArtistController from './artist.controller';
import AlbumModule from 'src/album/album.module';
import SongModule from 'src/song/song.module';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => SongModule),
		forwardRef(() => AlbumModule),
	],
	exports: [ArtistService],
	providers: [ArtistService],
	controllers: [ArtistController]
})
export default class ArtistModule {}
