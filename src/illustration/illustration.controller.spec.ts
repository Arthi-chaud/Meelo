import { Test, TestingModule } from '@nestjs/testing';
import { IllustrationController } from './illustration.controller';

describe('IllustrationController', () => {
  let controller: IllustrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IllustrationController],
    }).compile();

    controller = module.get<IllustrationController>(IllustrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
