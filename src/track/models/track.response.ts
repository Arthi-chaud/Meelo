import { IntersectionType } from "@nestjs/swagger";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Track } from "src/prisma/models";
import { ReleaseResponse } from "src/release/models/release.response";
import { SongResponse } from "src/song/models/song.response";

export class TrackResponse extends IntersectionType(
	IntersectionType(
		Track, IllustratedModel
	),
	class {
		song?: SongResponse;
		release?: ReleaseResponse;
	}
) {}