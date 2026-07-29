import { atom, useAtom, type WritableAtom } from "jotai";
import { useCallback, useMemo } from "react";

type Preferences<T> = Record<string, T>;

export const mkPagePreferenceAtom = <P extends {}>(
	rootAtom: WritableAtom<Preferences<P>, [Preferences<P>], void>,
	onSave: (p: Preferences<P>) => void,
) => {
	const preferenceAtom = atom(
		(get) => get(rootAtom),
		(_, set, newP: Preferences<P>) => {
			set(rootAtom, newP);
			onSave(newP);
		},
	);
	const usePreference = (route: string) => {
		const [prefs, setPrefs] = useAtom(preferenceAtom);
		const preference = useMemo((): P => {
			return prefs[route] ?? {};
		}, [prefs, route]);
		const updatePreference = useCallback(
			(f: (pref: P) => P) => {
				setPrefs({ ...prefs, [route]: f(prefs[route] ?? {}) });
			},
			[route, setPrefs, prefs],
		);
		return [preference, updatePreference] as const;
	};
	return { preferenceAtom, usePreference };
};
