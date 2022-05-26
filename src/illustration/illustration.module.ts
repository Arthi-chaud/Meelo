import { Module } from '@nestjs/common';
import { IllustrationService } from './illustration.service';
import { IllustrationController } from './illustration.controller';
import { FileManagerModule } from 'src/file-manager/file-manager.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { ReleaseModule } from 'src/release/release.module';

@Module({
  imports: [FileManagerModule, MetadataModule, ReleaseModule],
  providers: [IllustrationService],
  controllers: [IllustrationController]
})
export class IllustrationModule {}
