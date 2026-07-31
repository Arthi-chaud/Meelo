import type { ParsedUrlQuery } from "node:querystring";
import { useRouter } from "next/router";
import { usePrimaryArtistToggleControl as usePrimaryArtistsToggleControlBase } from "@/infinite-controls/primary-artists";
import {
	getPrimaryArtistsPreference as getPrefFromAtom,
	usePrimaryArtistsPreference,
} from "~/state/primary-artists-preference";
import { parseQueryParam, setQueryParam } from "~/utils/query-param";

export const ssrGetPrimaryArtistsPreference = (
	router: {
		query: ParsedUrlQuery;
		pathname: string;
	},
	defaultValue?: boolean,
) => {
	return getPrimaryArtistsPreference(router, defaultValue);
};

const getPrimaryArtistsPreference = (
	router: {
		query: ParsedUrlQuery;
		pathname: string;
	},
	defaultValue?: boolean,
) => {
	const toggleQuery = parseQueryParam(
		// biome-ignore lint/complexity/useLiteralKeys: Clarity
		router.query["primary-artists"],
		["true", "false"] as const,
	);
	if (toggleQuery === null) {
		return {
			primaryArtistsOnly:
				getPrefFromAtom(router.pathname)?.primaryArtistsOnly ??
				defaultValue,
		};
	}
	return { primaryArtistsOnly: toggleQuery === "true" };
};

export const usePrimaryArtistsToggleControl = ({
	enableToggle,
	defaultValue,
}: {
	enableToggle: boolean;
	defaultValue: boolean;
}) => {
	const router = useRouter();
	const [togglePref, setTogglePref] = usePrimaryArtistsPreference(
		router.route,
	);
	return usePrimaryArtistsToggleControlBase({
		defaultValue: togglePref?.primaryArtistsOnly ?? defaultValue,
		hook: () => {
			const router = useRouter();
			const pref = getPrimaryArtistsPreference(router, defaultValue);
			return {
				primaryArtistsOnly:
					pref.primaryArtistsOnly ?? defaultValue ?? true,
			};
		},
		enableToggle,
		onUpdate: (p) => {
			setQueryParam(
				[["primary-artists", p.primaryArtistsOnly?.toString() ?? null]],
				router,
			);
			setTogglePref(() => {
				return { primaryArtistsOnly: p.primaryArtistsOnly };
			});
		},
	});
};
