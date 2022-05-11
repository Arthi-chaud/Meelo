import { Module } from '@nestjs/common';
import { IllustrationService } from './illustration.service';
import { IllustrationController } from './illustration.controller';

@Module({
  providers: [IllustrationService],
  controllers: [IllustrationController]
})
export class IllustrationModule {}
