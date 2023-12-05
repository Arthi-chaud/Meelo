import { Module, forwardRef } from '@nestjs/common';
import AlbumModule from 'src/album/album.module';
import ArtistModule from 'src/artist/artist.module';
import FileManagerModule from 'src/file-manager/file-manager.module';
import FileModule from 'src/file/file.module';
import GenresModule from 'src/genre/genre.module';
import ReleaseModule from 'src/release/release.module';
import SettingsModule from 'src/settings/settings.module';
import SongModule from 'src/song/song.module';
import TrackModule from 'src/track/track.module';
import MetadataService from './scanner.service';
import ParserService from './parser.service';
import FfmpegService from './ffmpeg.service';

@Module({
	imports: [
		SettingsModule,
		FileManagerModule,
		forwardRef(() => TrackModule),
		forwardRef(() => SongModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => GenresModule),
		forwardRef(() => FileModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => ArtistModule)
	],
	providers: [MetadataService, ParserService, FfmpegService],
	exports: [MetadataService, ParserService, FfmpegService]
})
export default class ScannerModule { }
