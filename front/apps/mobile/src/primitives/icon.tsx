import { useUnistyles } from "react-native-unistyles";
import type { IconProps, Icon as IconType } from "@/ui/icons";

type IconStyle = { color?: string; size?: number } & IconProps["style"];

type Props = {
	icon: IconType;
	style?: IconStyle | IconStyle[];
	variant?: IconProps["variant"];
};

export const Icon = ({ icon: Icon, style, variant }: Props) => {
	const { theme } = useUnistyles();
	const size = Array.isArray(style)
		? style.find(({ size }) => size)?.size
		: style?.size;
	const color = Array.isArray(style)
		? style.find(({ color }) => color)?.color
		: style?.color;
	return (
		<Icon
			key={theme.name}
			style={style as any}
			size={size}
			color={color ?? theme.colors.text.primary}
			variant={variant ?? "Outline"}
		/>
	);
};
