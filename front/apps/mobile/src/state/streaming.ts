import { atom } from "jotai";
import * as yup from "yup";
import { AudioQuality } from "@/models/streaming";
import { storage } from "~/utils/storage";

const StreamingQuality = yup.object({
	audio: AudioQuality.default("320k"),
});
export type StreamingQuality = yup.InferType<typeof StreamingQuality>;

const StreamingPreferences = yup.object({
	wifi: StreamingQuality.default({
		audio: "320k",
	} satisfies StreamingQuality).required(),
	cellular: StreamingQuality.default({
		audio: "128k",
	} satisfies StreamingQuality).required(),
});
export type StreamingPreferences = yup.InferType<typeof StreamingPreferences>;
export type NetworkMode = keyof StreamingPreferences;
export const StreamingPreferenceKey = "streaming-preferences";
export const AllowTranscodingKey = "allow-transcoding";

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

export const allowTranscodingAtom = atom<boolean, [boolean], void>(
	(get) => get(_allowTranscodingAtom),
	(_, set, newPref) => {
		storage.set(AllowTranscodingKey, newPref);
		set(_allowTranscodingAtom, newPref);
	},
);

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

const _allowTranscodingAtom = atom(
	storage.getBoolean(AllowTranscodingKey) === true,
);
const _streamingPreferenceAtom = atom(readStreamingPreferences());
