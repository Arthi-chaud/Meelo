import { withUnistyles } from "react-native-unistyles";
import type { IconProps, Icon as IconType } from "@/ui/icons";

type IconStyle = { color?: string; size?: number } & IconProps["style"];

type Props = {
	icon: IconType;
	style?: IconStyle | IconStyle[];
	variant?: IconProps["variant"];
};

export const Icon = ({ icon, style, variant }: Props) => {
	const Icon = withUnistyles(icon, (theme) => ({
		size: Array.isArray(style)
			? style.find(({ size }) => size)?.size
			: style?.size,
		color: Array.isArray(style)
			? style.find(({ color }) => color)?.color
			: (style?.color ?? theme.colors.text.primary),
	}));
	return <Icon style={style as any} variant={variant ?? "Outline"} />;
};
