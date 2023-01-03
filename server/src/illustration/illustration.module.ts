import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import IllustrationService from './illustration.service';
import FileManagerModule from 'src/file-manager/file-manager.module';
import ReleaseModule from 'src/release/release.module';
import AlbumModule from 'src/album/album.module';
import TrackModule from 'src/track/track.module';
import FileModule from 'src/file/file.module';
import { IllustrationController } from './illustration.controller';
import ArtistModule from 'src/artist/artist.module';
import SettingsModule from 'src/settings/settings.module';
import MetadataModule from 'src/metadata/metadata.module';

@Module({
	imports: [
		FileManagerModule,
		HttpModule,
		forwardRef(() => MetadataModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => TrackModule),
		forwardRef(() => FileModule),
		SettingsModule
	],
	controllers: [IllustrationController],
	providers: [IllustrationService],
	exports: [IllustrationService]
})
export default class IllustrationModule { }
