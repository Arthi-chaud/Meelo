import { Module } from '@nestjs/common';
import { FileManagerModule } from 'src/file-manager/file-manager.module';
import { SettingsModule } from 'src/settings/settings.module';
import { SongModule } from 'src/song/song.module';
import { TrackModule } from 'src/track/track.module';
import { MetadataService } from './metadata.service';

@Module({
  imports: [SettingsModule, FileManagerModule, TrackModule, SongModule],
  providers: [MetadataService],
  exports: [MetadataService]
})
export class MetadataModule {}
