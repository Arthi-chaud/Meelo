import { forwardRef, Module }  from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import IllustrationService from './illustration.service';
import IllustrationController from './illustration.controller';
import FileManagerModule from 'src/file-manager/file-manager.module';
import ReleaseModule from 'src/release/release.module';
import AlbumModule from 'src/album/album.module';

@Module({
  imports: [
    FileManagerModule,
    ReleaseModule,
    HttpModule,
    forwardRef(() => AlbumModule)
  ],
  providers: [IllustrationService],
  exports: [IllustrationService],
  controllers: [IllustrationController]
})
export default class IllustrationModule {}
