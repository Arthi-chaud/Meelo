import type { ComponentProps } from "react";
import { TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
	onPress: () => void;
	children: React.ReactNode;
	disabled?: boolean;
	style?: ComponentProps<typeof TouchableOpacity>["style"];
};

// Wrapper around TouchableOpacity
export const Pressable = ({ onPress, children, style, disabled }: Props) => {
	return (
		<TouchableOpacity
			disabled={disabled}
			touchSoundDisabled
			style={[styles.root, style]}
			onPress={onPress}
		>
			{children}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		borderRadius: theme.borderRadius,
		paddingHorizontal: theme.gap(1),
		overflow: "hidden",
	},
}));
