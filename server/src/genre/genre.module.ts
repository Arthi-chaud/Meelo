import { Module, forwardRef } from "@nestjs/common";
import AlbumModule from "src/album/album.module";
import ArtistModule from "src/artist/artist.module";
import PrismaModule from "src/prisma/prisma.module";
import SongModule from "src/song/song.module";
import { GenreController } from "./genre.controller";
import GenreService from "./genre.service";

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => SongModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => AlbumModule),
	],
	controllers: [GenreController],
	providers: [GenreService],
	exports: [GenreService],
})
export default class GenreModule {}
