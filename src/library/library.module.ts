import { Module, forwardRef } from '@nestjs/common';
import LibraryController from './library.controller';
import LibraryService from './library.service';
import FileManagerModule from 'src/file-manager/file-manager.module';
import FileModule from 'src/file/file.module';
import MetadataModule from 'src/metadata/metadata.module';
import PrismaModule from 'src/prisma/prisma.module';
import IllustrationModule from 'src/illustration/illustration.module';
import ArtistModule from 'src/artist/artist.module';
import AlbumModule from 'src/album/album.module';
import SongModule from 'src/song/song.module';
import ReleaseModule from 'src/release/release.module';
import TrackModule from 'src/track/track.module';
import { LyricsModule } from 'src/lyrics/lyrics.module';
import TasksModule from 'src/tasks/tasks.module';

@Module({
	imports: [
		PrismaModule,
		FileManagerModule,
		forwardRef(() => FileModule),
		MetadataModule,
		IllustrationModule,
		ArtistModule,
		AlbumModule,
		LyricsModule,
		SongModule,
		ReleaseModule,
		forwardRef(() => TasksModule),
		forwardRef(() => TrackModule)
	],
	controllers: [LibraryController],
	providers: [LibraryService],
	exports: [LibraryService]
})
export default class LibraryModule {}
