import { Test, TestingModule } from '@nestjs/testing';
import { ReleaseService } from './release.service';

describe('ReleaseService', () => {
  let service: ReleaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReleaseService],
    }).compile();

    service = module.get<ReleaseService>(ReleaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
