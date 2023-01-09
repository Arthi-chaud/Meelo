import { Module, forwardRef } from '@nestjs/common';
import AlbumService from './album.service';
import ArtistModule from 'src/artist/artist.module';
import PrismaModule from 'src/prisma/prisma.module';
import AlbumController from './album.controller';
import ReleaseModule from 'src/release/release.module';
import IllustrationModule from 'src/illustration/illustration.module';
import TrackModule from 'src/track/track.module';
import GenreModule from "../genre/genre.module";
import { AlbumResponseBuilder } from './models/album.response';
import AlbumIllustrationService from './album-illustration.service';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => IllustrationModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => TrackModule),
		GenreModule,
	],
	exports: [AlbumService, AlbumResponseBuilder, AlbumIllustrationService],
	providers: [AlbumService, AlbumResponseBuilder, AlbumIllustrationService],
	controllers: [AlbumController]
})
export default class AlbumModule {}
