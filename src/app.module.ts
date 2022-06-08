import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileModule } from './file/file.module';
import { ArtistModule } from './artist/artist.module';
import { AlbumModule } from './album/album.module';
import { ReleaseModule } from './release/release.module';
import { TrackModule } from './track/track.module';
import { SongModule } from './song/song.module';
import { SettingsModule } from './settings/settings.module';
import { LibraryModule } from './library/library.module';
import { IllustrationModule } from './illustration/illustration.module';
import { SettingsService } from './settings/settings.service';
import { FileManagerModule } from './file-manager/file-manager.module';
import { MetadataModule } from './metadata/metadata.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SettingsModule,
    FileManagerModule,
    FileModule,
    ArtistModule,
    AlbumModule,
    ReleaseModule,
    TrackModule,
    SongModule,
    LibraryModule,
    IllustrationModule,
    MetadataModule,
    PrismaModule,
  ],
  providers: [SettingsService],
})
export class AppModule {}
