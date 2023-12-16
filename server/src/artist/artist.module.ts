import { Module, forwardRef } from "@nestjs/common";
import ArtistService from "./artist.service";
import PrismaModule from "src/prisma/prisma.module";
import ArtistController from "./artist.controller";
import AlbumModule from "src/album/album.module";
import SongModule from "src/song/song.module";
import { ArtistResponseBuilder } from "./models/artist.response";
import SettingsModule from "src/settings/settings.module";
import TrackModule from "src/track/track.module";
import IllustrationModule from "src/illustration/illustration.module";
import ProvidersModule from "src/providers/providers.module";

@Module({
	imports: [
		PrismaModule,
		SettingsModule,
		forwardRef(() => ProvidersModule),
		forwardRef(() => IllustrationModule),
		forwardRef(() => SongModule),
		forwardRef(() => AlbumModule),
		forwardRef(() => TrackModule),
	],
	exports: [ArtistService, ArtistResponseBuilder],
	providers: [ArtistService, ArtistResponseBuilder],
	controllers: [ArtistController],
})
export default class ArtistModule {}
