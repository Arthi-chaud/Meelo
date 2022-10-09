import { IntersectionType } from "@nestjs/swagger";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Track } from "src/prisma/models";

export class TrackResponse extends IntersectionType(
	IntersectionType(
		Track, IllustratedModel
	),
	class {
		song?: unknown;
		release?: unknown
	}
) {}