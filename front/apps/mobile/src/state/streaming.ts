import { atom } from "jotai";
import * as yup from "yup";
import { AudioQuality } from "@/models/streaming";
import { storage } from "~/utils/storage";
import type { MeeloInstance } from "./user";

const StreamingQuality = yup.object({
	audio: AudioQuality.default("320k"),
});
export type StreamingQuality = yup.InferType<typeof StreamingQuality>;

export const InstanceStreamingPreferences = yup.object({
	allowTranscoding: yup.boolean().default(true),
	wifi: StreamingQuality.default({
		audio: "320k",
	} satisfies StreamingQuality).required(),
	cellular: StreamingQuality.default({
		audio: "128k",
	} satisfies StreamingQuality).required(),
});
export type InstanceStreamingPreferences = yup.InferType<
	typeof InstanceStreamingPreferences
>;
export type StreamingPreferences = Record<string, InstanceStreamingPreferences>;
export type NetworkMode = keyof Omit<
	InstanceStreamingPreferences,
	"allowTranscoding"
>;
export const StreamingPreferenceKey = "streaming-preferences";

const readStreamingPreferences = (): StreamingPreferences => {
	const stringPrefs = storage.getString(StreamingPreferenceKey);
	if (!stringPrefs) {
		return {};
	}
	try {
		const obj = JSON.parse(stringPrefs);
		if (typeof obj !== "object") {
			return {};
		}
		const prefs: StreamingPreferences = {};
		for (const [instanceUrl, rawInstancePrefs] of Object.entries(obj)) {
			if (typeof instanceUrl !== "string") {
				continue;
			}
			try {
				const instancePrefs = InstanceStreamingPreferences.validateSync(
					rawInstancePrefs,
					{},
				);
				prefs[instanceUrl] = instancePrefs;
			} catch {
				prefs[instanceUrl] = InstanceStreamingPreferences.getDefault();
			}
		}
		return obj;
	} catch (e) {
		// biome-ignore lint/suspicious/noConsole: For debug
		console.warn(
			`An error occured when reading streaming preferences: ${e}`,
		);
		return {};
	}
};

export const setInstanceStreamingPreferenceAtom = atom(
	null,
	(
		get,
		set,
		instance: MeeloInstance,
		instancePrefs: InstanceStreamingPreferences,
	) => {
		const prefs = get(streamingPreferenceAtom);
		set(streamingPreferenceAtom, {
			...prefs,
			[instance.url]: instancePrefs,
		});
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

const _streamingPreferenceAtom = atom(readStreamingPreferences());
