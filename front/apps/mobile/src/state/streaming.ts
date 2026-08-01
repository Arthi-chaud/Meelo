import { atom } from "jotai";
import * as yup from "yup";
import { storage } from "~/utils/storage";

export const AudioQualities = [
	"128k",
	"192k",
	"256k",
	"320k",
	"512k",
	"original",
] as const;
type AudioQuality = (typeof AudioQualities)[number];

export const VideoQualities = [
	"240p",
	"480p",
	"720p",
	"1080p",
	"original",
] as const;
type VideoQuality = (typeof VideoQualities)[number];

const StreamingQuality = yup.object({
	audio: yup.mixed<AudioQuality>().oneOf(AudioQualities).default("320k"),
	video: yup.mixed<VideoQuality>().oneOf(VideoQualities).default("original"),
});
type StreamingQuality = yup.InferType<typeof StreamingQuality>;

const StreamingPreferences = yup.object({
	wifi: StreamingQuality.default({
		audio: "320k",
		video: "1080p",
	} satisfies StreamingQuality).required(),
	cellular: StreamingQuality.default({
		audio: "128k",
		video: "720p",
	} satisfies StreamingQuality).required(),
	download: StreamingQuality.default({
		audio: "256k",
		video: "720p",
	} satisfies StreamingQuality).required(),
});
type StreamingPreferences = yup.InferType<typeof StreamingPreferences>;
export const StreamingPreferenceKey = "streaming-preferences";

const readStreamingPreferences = (): StreamingPreferences => {
	const stringPrefs = storage.getString(StreamingPreferenceKey);
	if (!stringPrefs) {
		return StreamingPreferences.getDefault();
	}
	try {
		const prefs = StreamingPreferences.validateSync(
			JSON.parse(stringPrefs),
		);
		return prefs;
	} catch (e) {
		// biome-ignore lint/suspicious/noConsole: For debug
		console.warn(
			`An error occured when reading streaming preferences: ${e}`,
		);
		return StreamingPreferences.getDefault();
	}
};

export const streamingPreferenceAtom = atom<
	StreamingPreferences,
	[StreamingPreferences],
	void
>(
	(get) => get(_streamingPreferenceAtom),
	(_, set, newPref) => {
		// TODO: Validate?
		storage.set(StreamingPreferenceKey, JSON.stringify(newPref));
		set(_streamingPreferenceAtom, newPref);
	},
);

const _streamingPreferenceAtom = atom(readStreamingPreferences());
