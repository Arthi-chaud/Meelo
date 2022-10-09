import { IntersectionType } from "@nestjs/swagger";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Song } from "src/prisma/models";

export class SongResponse extends IntersectionType(
	IntersectionType(
		Song, IllustratedModel
	),
	class {
		artist?: unknown;
		tracks?: unknown
	}
) {}