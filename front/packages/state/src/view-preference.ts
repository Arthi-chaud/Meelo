import type { ItemSize, LayoutOption } from "@/models/layout";
import type { SortingParameters } from "@/models/sorting";
import { mkPagePreferenceAtom } from "./page-preference";

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

export const mkViewPreferenceAtom = mkPagePreferenceAtom<ViewPreference>;
