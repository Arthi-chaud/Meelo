import { Module } from '@nestjs/common';
import { MetadataParserService } from './metadata-parser.service';

@Module({
  providers: [MetadataParserService]
})
export class MetadataParserModule {}
