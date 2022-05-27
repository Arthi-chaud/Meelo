import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
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
import { MeeloExceptionFilter } from './exceptions/meelo-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({}),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST!,
      port: 5432, // Default postgres post
      username: process.env.POSTGRES_USER!,
      password: process.env.POSTGRES_PASSWORD!,
      database: process.env.POSTGRES_DB!,
      autoLoadModels: true,
      sync: { force: true, },
      synchronize: true,
    }),
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
  ],
  providers: [AppService, SettingsService],
})
export class AppModule {}
