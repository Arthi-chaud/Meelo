import { IntersectionType } from "@nestjs/swagger";
import { ArtistResponse } from "src/artist/models/artist.response";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Song } from "src/prisma/models";
import { TrackResponse } from "src/track/models/track.response";

export class SongResponse extends IntersectionType(
	IntersectionType(
		Song, IllustratedModel
	),
	class {
		artist?: ArtistResponse;
		tracks?: TrackResponse[];
	}
) {}