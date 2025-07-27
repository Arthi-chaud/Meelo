import type Illustration from "@/models/illustration";
import type { ComponentProps } from "react";
import type { Illustration as IllustrationComponent } from "~/components/illustration";
import type { Action } from "~/actions";

export type ContextMenuItem = Action;

export type ContextMenuHeader = {
	illustration: Illustration | null | undefined;
	illustrationProps?: Omit<
		ComponentProps<typeof IllustrationComponent>,
		"illustration" | "quality"
	>;
	title: string | undefined;
	subtitle: string | undefined | null;
};

export type ContextMenuProps = {
	items: ContextMenuItem[][];
	header: ContextMenuHeader;
};
