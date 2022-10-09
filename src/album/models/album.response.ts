import { IntersectionType } from "@nestjs/swagger";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Album } from "src/prisma/models";

export class AlbumResponse extends IntersectionType(
	IntersectionType(
		Album, IllustratedModel
	),
	class {
		artist?: unknown;
		releases?: unknown
	}
) {}