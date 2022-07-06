import { Module } from '@nestjs/common';
import AlbumModule from 'src/album/album.module';
import ArtistModule from 'src/artist/artist.module';
import FileManagerModule from 'src/file-manager/file-manager.module';
import ReleaseModule from 'src/release/release.module';
import SettingsModule from 'src/settings/settings.module';
import SongModule from 'src/song/song.module';
import TrackModule from 'src/track/track.module';
import MetadataService from './metadata.service';

@Module({
	imports: [SettingsModule, FileManagerModule, TrackModule, SongModule, ReleaseModule, AlbumModule, ArtistModule],
	providers: [MetadataService],
	exports: [MetadataService]
})
export default class MetadataModule { }
