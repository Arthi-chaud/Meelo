import { getCookie, setCookie } from "cookies-next";
import { atom } from "jotai";
import { store } from "@/state/store";
import {
	loadViewPreferences,
	mkViewPreferenceAtom,
	type ViewPreference,
	ViewPreferenceKey,
	type ViewPreferences,
} from "@/state/view-preference";

const _viewPreferences = atom<ViewPreferences>(
	loadViewPreferences(getCookie(ViewPreferenceKey)),
);

export const { viewPreferenceAtom, useViewPreference } = mkViewPreferenceAtom(
	_viewPreferences,
	(newVP) => {
		const expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);
		setCookie(ViewPreferenceKey, JSON.stringify(newVP), { expires });
	},
);

// To be used in SSR
export const getViewPreference = (route: string): ViewPreference =>
	store.get(_viewPreferences)[route] ?? {};
