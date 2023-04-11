import { Module, forwardRef } from '@nestjs/common';
import LibraryModule from 'src/library/library.module';
import TasksController from './tasks.controller';
import TrackModule from 'src/track/track.module';
import FileManagerModule from 'src/file-manager/file-manager.module';
import FileModule from 'src/file/file.module';
import IllustrationModule from 'src/illustration/illustration.module';
import { LyricsModule } from 'src/lyrics/lyrics.module';
import MetadataModule from 'src/metadata/metadata.module';
import SettingsModule from 'src/settings/settings.module';
import FfmpegModule from 'src/ffmpeg/ffmpeg.module';
import SongModule from 'src/song/song.module';
import ReleaseModule from 'src/release/release.module';
import AlbumModule from 'src/album/album.module';
import ArtistModule from 'src/artist/artist.module';
import GenreModule from 'src/genre/genre.module';
import ProvidersModule from 'src/providers/providers.module';
import TaskRunner, { TaskQueue } from './tasks.runner';
import { BullModule } from '@nestjs/bull';

@Module({
	imports: [
		BullModule.registerQueue({
			name: TaskQueue,
		}),
		forwardRef(() => LibraryModule),
		FileManagerModule,
		forwardRef(() => FileModule),
		forwardRef(() => TrackModule),
		forwardRef(() => MetadataModule),
		LyricsModule,
		SettingsModule,
		FfmpegModule,
		forwardRef(() => ProvidersModule),
		forwardRef(() => SongModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => GenreModule),
		forwardRef(() => IllustrationModule),
	],
	controllers: [TasksController],
	providers: [TaskRunner],
	exports: [TaskRunner]
})
export default class TasksModule {}
