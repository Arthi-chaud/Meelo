import type { Icon as IconType } from "@/ui/icons";
import type { Href } from "expo-router";
export type Action = {
	icon: IconType;
	label: TranslationKey;
	onPress?: () => void;
	href?: Href;
	disabled?: boolean;
};
