import { atom, useAtom, type WritableAtom } from "jotai";
import { useCallback, useMemo } from "react";
import type { ItemSize, LayoutOption } from "@/models/layout";
import type { SortingParameters } from "@/models/sorting";

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

// Parses string JSON
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

export const mkViewPreferenceAtom = (
	rootAtom: WritableAtom<ViewPreferences, [ViewPreferences], void>,
	onSave: (vp: ViewPreferences) => void,
) => {
	const viewPreferenceAtom = atom(
		(get) => get(rootAtom),
		(_, set, newVP: ViewPreferences) => {
			set(rootAtom, newVP);
			onSave(newVP);
		},
	);
	const useViewPreference = (route: string) => {
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
	return { viewPreferenceAtom, useViewPreference };
};
