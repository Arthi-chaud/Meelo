import { mkPagePreferenceAtom } from "./page-preference";

export type PrimaryArtistsPreference = {
	primaryArtistsOnly?: boolean;
};

// The key being the route to use the view preference on
export type PrimaryArtistsPreferences = Record<
	string,
	PrimaryArtistsPreference
>;

export const PrimaryArtistsPreferenceKey = "artists_preferences";

// Parses string JSON
export const loadPrimaryArtistsPreferences = (
	c?: any,
): PrimaryArtistsPreferences => {
	const cookieValue = c?.toString();

	if (!cookieValue) {
		return {};
	}
	try {
		return JSON.parse(cookieValue);
	} catch {
		return {};
	}
};

export const mkPrimaryArtistsPreferenceAtom =
	mkPagePreferenceAtom<PrimaryArtistsPreference>;
