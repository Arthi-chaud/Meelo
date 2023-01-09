import { Module, forwardRef } from '@nestjs/common';
import ArtistService from './artist.service';
import PrismaModule from 'src/prisma/prisma.module';
import ArtistController from './artist.controller';
import AlbumModule from 'src/album/album.module';
import SongModule from 'src/song/song.module';
import { ArtistResponseBuilder } from './models/artist.response';
import ArtistIllustrationService from './artist-illustration.service';
import SettingsModule from 'src/settings/settings.module';
import TrackModule from 'src/track/track.module';

@Module({
	imports: [
		PrismaModule,
		SettingsModule,
		forwardRef(() => SongModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => TrackModule),
	],
	exports: [ArtistIllustrationService, ArtistService, ArtistResponseBuilder],
	providers: [ArtistIllustrationService, ArtistService, ArtistResponseBuilder],
	controllers: [ArtistController]
})
export default class ArtistModule {}
