import { Module, forwardRef } from '@nestjs/common';
import { SongController } from './song.controller';
import ArtistModule from 'src/artist/artist.module';
import PrismaModule from 'src/prisma/prisma.module';
import SongService from './song.service';
import TrackModule from 'src/track/track.module';
import GenreModule from 'src/genre/genre.module';
import { LyricsModule } from 'src/lyrics/lyrics.module';
import IllustrationModule from 'src/illustration/illustration.module';
import { SongResponseBuilder } from './models/song.response';
import ReleaseModule from 'src/release/release.module';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => LyricsModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => TrackModule),
		forwardRef(() => GenreModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => IllustrationModule)
	],
	exports: [SongService, SongResponseBuilder],
	providers: [SongService, SongResponseBuilder],
	controllers: [SongController]
})
export default class SongModule {}
