import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import IllustrationService from './illustration.service';
import FileManagerModule from 'src/file-manager/file-manager.module';
import ReleaseModule from 'src/release/release.module';
import AlbumModule from 'src/album/album.module';
import TrackModule from 'src/track/track.module';
import FileModule from 'src/file/file.module';

@Module({
	imports: [
		FileManagerModule,
		HttpModule,
		forwardRef(() => AlbumModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => TrackModule),
		FileModule
	],
	providers: [IllustrationService],
	exports: [IllustrationService]
})
export default class IllustrationModule { }
