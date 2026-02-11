import { getCookie, setCookie } from "cookies-next";
import { atom, useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import type { ItemSize, LayoutOption } from "@/models/layout";
import type { SortingParameters } from "@/models/sorting";
import { store } from "@/state/store";

export type ViewPreference = {
	layout?: Partial<{
		layout: LayoutOption;
		itemSize: ItemSize;
	}>;
	sort?: Partial<SortingParameters<any>>;
};

// The key being the route to use the view preference on
export type ViewPreferences = Record<string, ViewPreference>;

export const ViewPreferenceKey = "view_preferences";

export const loadViewPreferences = (c?: any): ViewPreferences => {
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

const _viewPreferences = atom<ViewPreferences>(
	loadViewPreferences(getCookie(ViewPreferenceKey)),
);

export const viewPreferenceAtom = atom(
	(get) => get(_viewPreferences),
	(_, set, newVP: ViewPreferences) => {
		set(_viewPreferences, newVP);

		const expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);
		setCookie(ViewPreferenceKey, JSON.stringify(newVP), { expires });
	},
);

export const useViewPreference = (route: string) => {
	const [prefs, setPrefs] = useAtom(viewPreferenceAtom);
	const preference = useMemo((): ViewPreference => {
		return prefs[route] ?? {};
	}, [prefs, route]);
	const updatePreference = useCallback(
		(f: (pref: ViewPreference) => ViewPreference) => {
			setPrefs({ ...prefs, [route]: f(prefs[route] ?? {}) });
		},
		[route, setPrefs, prefs],
	);
	return [preference, updatePreference] as const;
};

// To be used in SSR
export const getViewPreference = (route: string): ViewPreference =>
	store.get(_viewPreferences)[route] ?? {};
