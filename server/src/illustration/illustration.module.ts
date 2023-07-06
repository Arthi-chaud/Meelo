import { Module, forwardRef } from '@nestjs/common';
import IllustrationService from './illustration.service';
import FileManagerModule from 'src/file-manager/file-manager.module';
import ReleaseModule from 'src/release/release.module';
import AlbumModule from 'src/album/album.module';
import TrackModule from 'src/track/track.module';
import FileModule from 'src/file/file.module';
import { IllustrationController } from './illustration.controller';
import ArtistModule from 'src/artist/artist.module';
import SettingsModule from 'src/settings/settings.module';
import FfmpegModule from 'src/ffmpeg/ffmpeg.module';
import SongModule from 'src/song/song.module';
import ProvidersModule from 'src/providers/providers.module';
import PlaylistModule from 'src/playlist/playlist.module';
import IllustrationRepository from './illustration.repository';
import PrismaModule from 'src/prisma/prisma.module';

@Module({
	imports: [
		PrismaModule,
		FileManagerModule,
		forwardRef(() => ArtistModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => TrackModule),
		forwardRef(() => SongModule),
		forwardRef(() => FileModule),
		forwardRef(() => ProvidersModule),
		forwardRef(() => PlaylistModule),
		SettingsModule,
		FfmpegModule
	],
	controllers: [IllustrationController],
	providers: [IllustrationService, IllustrationRepository],
	exports: [IllustrationService, IllustrationRepository]
})
export default class IllustrationModule { }
