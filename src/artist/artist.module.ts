import { Module } from '@nestjs/common';
import { ArtistService } from './artist.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
	imports: [
		PrismaModule,
	],
	exports: [ArtistService],
	providers: [ArtistService]
})
export class ArtistModule {}
