import { Module, forwardRef } from '@nestjs/common';
import { TrackController } from './track.controller';
import FileModule from 'src/file/file.module';
import PrismaModule from 'src/prisma/prisma.module';
import ReleaseModule from 'src/release/release.module';
import SongModule from 'src/song/song.module';
import TrackService from './track.service';
import IllustrationModule from 'src/illustration/illustration.module';
import AlbumModule from 'src/album/album.module';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => SongModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => IllustrationModule),
		FileModule
	],
	exports: [TrackService],
	providers: [TrackService],
	controllers: [TrackController]
})
export default class TrackModule {}
