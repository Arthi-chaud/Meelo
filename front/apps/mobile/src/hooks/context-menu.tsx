import { atom, useSetAtom } from "jotai";
import { useCallback } from "react";
import type { ContextMenuProps } from "~/components/context-menu/model";

export const contextMenuAtom = atom<ContextMenuProps | null>();

export const useContextMenu = (props: ContextMenuProps | undefined) => {
	const setContextMenu = useSetAtom(contextMenuAtom);
	const openContextMenu = useCallback(
		() => props && setContextMenu(props),
		[props, setContextMenu],
	);

	return { openContextMenu };
};
