import { getCookie, setCookie } from "cookies-next";
import { atom } from "jotai";
import {
	loadPrimaryArtistsPreferences,
	mkPrimaryArtistsPreferenceAtom,
	type PrimaryArtistsPreference,
	PrimaryArtistsPreferenceKey,
	type PrimaryArtistsPreferences,
} from "@/state/primary-artists-preference";
import { store } from "@/state/store";

const _primaryArtistsPreferences = atom<PrimaryArtistsPreferences>(
	loadPrimaryArtistsPreferences(getCookie(PrimaryArtistsPreferenceKey)),
);

export const {
	usePreference: usePrimaryArtistsPreference,
	preferenceAtom: primaryArtistsAtom,
} = mkPrimaryArtistsPreferenceAtom(_primaryArtistsPreferences, (newP) => {
	const expires = new Date();
	expires.setFullYear(expires.getFullYear() + 1);
	setCookie(PrimaryArtistsPreferenceKey, JSON.stringify(newP), { expires });
});

export const getPrimaryArtistsPreference = (
	route: string,
): PrimaryArtistsPreference =>
	store.get(_primaryArtistsPreferences)[route] ?? {};
