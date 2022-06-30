import { Module, forwardRef } from '@nestjs/common';
import { ArtistService } from './artist.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ArtistController } from './artist.controller';
import { IllustrationModule } from 'src/illustration/illustration.module';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => IllustrationModule)
	],
	exports: [ArtistService],
	providers: [ArtistService],
	controllers: [ArtistController]
})
export class ArtistModule {}
