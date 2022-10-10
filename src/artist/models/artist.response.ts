import { IntersectionType } from "@nestjs/swagger";
import { AlbumResponse } from "src/album/models/album.response";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Artist } from "src/prisma/models";
import { SongResponse } from "src/song/models/song.response";

export class ArtistResponse extends IntersectionType(
	IntersectionType(
		Artist, IllustratedModel
	),
	class {
		albums?: AlbumResponse[];
		songs?: SongResponse[];
	}
) {}