import * as yup from "yup";

export const RipSources = [
	"CD",
	"DVD",
	"BluRay",
	"Cassette",
	"Digital",
	"Vinyl",
	"Other",
] as const;

export type RipSource = (typeof RipSources)[number];

export const RipSource = yup.mixed<RipSource>().oneOf(RipSources);
