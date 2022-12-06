import { Module, forwardRef } from '@nestjs/common';
import TasksService from './tasks.service';
import LibraryModule from 'src/library/library.module';
import TasksController from './tasks.controller';
import TrackModule from 'src/track/track.module';
import FileManagerModule from 'src/file-manager/file-manager.module';
import FileModule from 'src/file/file.module';
import IllustrationModule from 'src/illustration/illustration.module';
import { LyricsModule } from 'src/lyrics/lyrics.module';
import MetadataModule from 'src/metadata/metadata.module';

@Module({
	imports: [
		forwardRef(() => LibraryModule),
		FileManagerModule,
		forwardRef(() => FileModule),
		TrackModule,
		MetadataModule,
		LyricsModule,
		IllustrationModule,
	],
	controllers: [TasksController],
	providers: [TasksService],
	exports: [TasksService]
})
export default class TasksModule {}
