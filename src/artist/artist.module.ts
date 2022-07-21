import { Module, forwardRef } from '@nestjs/common';
import ArtistService from './artist.service';
import PrismaModule from 'src/prisma/prisma.module';
import ArtistController from './artist.controller';
import AlbumModule from 'src/album/album.module';
import SongModule from 'src/song/song.module';
import IllustrationModule from 'src/illustration/illustration.module';
import TrackModule from 'src/track/track.module';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => SongModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => TrackModule),
		IllustrationModule
	],
	exports: [ArtistService],
	providers: [ArtistService],
	controllers: [ArtistController]
})
export default class ArtistModule {}
