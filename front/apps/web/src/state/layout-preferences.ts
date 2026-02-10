import { getCookie, setCookie } from "cookies-next";
import { atom, useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import type { ItemSize, LayoutOption } from "@/models/layout";

export type LayoutPreference = {
	layout?: LayoutOption;
	itemSize?: ItemSize;
};

// The key being the route to use the layout preference on
export type LayoutPreferences = Record<string, LayoutPreference>;

export const LayoutPreferenceKey = "layout_preference";

export const loadLayoutPreferences = (c?: any): LayoutPreferences => {
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

const _layoutPreference = atom<LayoutPreferences>(
	loadLayoutPreferences(getCookie(LayoutPreferenceKey)),
);

export const layoutPreferenceAtom = atom(
	(get) => get(_layoutPreference),
	(_, set, newLP: LayoutPreferences) => {
		set(_layoutPreference, newLP);

		const expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);
		setCookie(LayoutPreferenceKey, JSON.stringify(newLP), { expires });
	},
);

export const useLayoutPreference = (route: string) => {
	const [prefs, setPrefs] = useAtom(layoutPreferenceAtom);
	const preference = useMemo((): LayoutPreference => {
		return prefs[route] ?? {};
	}, [prefs, route]);
	const updatePreference = useCallback(
		(pref: LayoutPreference) => {
			setPrefs({ ...prefs, [route]: pref });
		},
		[route, setPrefs, prefs],
	);
	return [preference, updatePreference] as const;
};
