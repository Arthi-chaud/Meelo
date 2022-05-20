import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
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

@Module({
  imports: [
    ConfigModule.forRoot({}),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: 5432, // Default postgres post
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      autoLoadModels: true,
      sync: { force: true, },
      synchronize: true,
    }),
    FileModule,
    ArtistModule,
    AlbumModule,
    ReleaseModule,
    TrackModule,
    SongModule,
    SettingsModule,
    LibraryModule,
    IllustrationModule,
    FileManagerModule,
  ],
  controllers: [AppController],
  providers: [AppService, SettingsService],
})
export class AppModule {}
