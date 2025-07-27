import type Illustration from "@/models/illustration";
import type { Icon as IconType } from "@/ui/icons";
import type { Href } from "expo-router";

export type ContextMenuItem = {
	icon: IconType;
	label: TranslationKey;
	onPress?: () => void;
	href?: Href;
	disabled?: boolean;
};

export type ContextMenuHeader = {
	illustration: Illustration | null | undefined;
	title: string | undefined;
	subtitle: string | undefined | null;
};

export type ContextMenuProps = {
	items: ContextMenuItem[][];
	header: ContextMenuHeader;
};
