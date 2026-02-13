import { atom } from "jotai";
import {
	loadViewPreferences,
	mkViewPreferenceAtom,
	ViewPreferenceKey,
	type ViewPreferences,
} from "@/state/view-preference";
import { storage } from "~/utils/storage";

const _viewPreferences = atom<ViewPreferences>(
	loadViewPreferences(storage.getString(ViewPreferenceKey)),
);

export const { viewPreferenceAtom, useViewPreference } = mkViewPreferenceAtom(
	_viewPreferences,
	(newVP) => {
		storage.set(ViewPreferenceKey, JSON.stringify(newVP));
	},
);
