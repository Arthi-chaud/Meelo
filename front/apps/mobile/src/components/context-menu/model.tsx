import type Illustration from "@/models/illustration";
import type { Action } from "~/actions";

export type ContextMenuItem = Action;

export type ContextMenuHeader = {
	illustration: Illustration | null | undefined;
	title: string | undefined;
	subtitle: string | undefined | null;
};

export type ContextMenuProps = {
	items: ContextMenuItem[][];
	header: ContextMenuHeader;
};
