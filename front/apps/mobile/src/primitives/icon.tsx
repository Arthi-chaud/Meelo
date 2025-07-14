import type { IconProps, Icon as IconType } from "@/ui/icons";
import { withUnistyles } from "react-native-unistyles";

type IconStyle = { color: string } & IconProps["style"];

type Props = {
	icon: IconType;
	style?: IconStyle | IconStyle[];
	variant?: IconProps["variant"];
};

export const Icon = ({ icon, style, variant }: Props) => {
	const Icon = withUnistyles(icon, (theme) => ({
		color: Array.isArray(style)
			? style.find(({ color }) => color)?.color
			: (style?.color ?? theme.colors.text.primary),
	}));
	return <Icon style={style as any} variant={variant ?? "Outline"} />;
};
