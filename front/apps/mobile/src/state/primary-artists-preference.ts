import { atom } from "jotai";
import {
	loadPrimaryArtistsPreferences,
	mkPrimaryArtistsPreferenceAtom,
	PrimaryArtistsPreferenceKey,
	type PrimaryArtistsPreferences,
} from "@/state/primary-artists-preference";
import { storage } from "~/utils/storage";

const _primaryArtistsPreferences = atom<PrimaryArtistsPreferences>(
	loadPrimaryArtistsPreferences(
		storage.getString(PrimaryArtistsPreferenceKey),
	),
);

export const {
	preferenceAtom: primaryArtistsPreferenceAtom,
	usePreference: usePrimaryArtistsPreference,
} = mkPrimaryArtistsPreferenceAtom(_primaryArtistsPreferences, (newVP) => {
	storage.set(PrimaryArtistsPreferenceKey, JSON.stringify(newVP));
});
