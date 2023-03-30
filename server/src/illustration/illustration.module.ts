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

@Module({
	imports: [
		FileManagerModule,
		forwardRef(() => ArtistModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => TrackModule),
		forwardRef(() => SongModule),
		forwardRef(() => FileModule),
		forwardRef(() => ProvidersModule),
		SettingsModule,
		FfmpegModule
	],
	controllers: [IllustrationController],
	providers: [IllustrationService],
	exports: [IllustrationService]
})
export default class IllustrationModule { }
