import { Test, TestingModule } from '@nestjs/testing';
import { IllustrationService } from './illustration.service';

describe('IllustrationService', () => {
  let service: IllustrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IllustrationService],
    }).compile();

    service = module.get<IllustrationService>(IllustrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
