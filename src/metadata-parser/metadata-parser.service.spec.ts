import { Test, TestingModule } from '@nestjs/testing';
import { MetadataParserService } from './metadata-parser.service';

describe('MetadataParserService', () => {
  let service: MetadataParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetadataParserService],
    }).compile();

    service = module.get<MetadataParserService>(MetadataParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
