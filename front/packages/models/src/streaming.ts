import * as yup from "yup";
export const AudioQualities = [
	"128k",
	"192k",
	"256k",
	"320k",
	"512k",
	"original",
	"direct",
] as const;
export const AudioQuality = yup
	.mixed<AudioQuality>()
	.oneOf(AudioQualities)
	.required();
export type AudioQuality = (typeof AudioQualities)[number];
