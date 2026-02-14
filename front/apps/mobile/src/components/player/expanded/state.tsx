import { atom } from "jotai";

export const playerIsExpandedAtom = atom((get) => get(playerIsExpanded_));
export const expandPlayerAtom = atom(null, (_, set) =>
	set(toggleExpandedPlayerAtom, true),
);

export const collapsePlayerAtom = atom(null, (_, set) =>
	set(toggleExpandedPlayerAtom, false),
);
const toggleExpandedPlayerAtom = atom(null, (_, set, expand: boolean) =>
	set(playerIsExpanded_, expand),
);
const playerIsExpanded_ = atom(false);
