import { IntersectionType } from "@nestjs/swagger";
import { ArtistResponse } from "src/artist/models/artist.response";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Album } from "src/prisma/models";
import { ReleaseResponse } from "src/release/models/release.response";

export class AlbumResponse extends IntersectionType(
	IntersectionType(
		Album, IllustratedModel
	),
	class {
		artist?: ArtistResponse | null;
		releases?: ReleaseResponse[];
	}
) {}