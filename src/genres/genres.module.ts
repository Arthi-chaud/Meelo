import { Module } from '@nestjs/common';
import { GenresService } from './genres.service';

@Module({
  providers: [GenresService],
  exports: [GenresService]
})
export class GenresModule {}
