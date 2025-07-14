import type { ComponentProps } from "react";
import { TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
	onPress: () => void;
	children: React.ReactNode;
	style?: ComponentProps<typeof TouchableOpacity>["style"];
};

// Wrapper around TouchableOpacity
export const Pressable = ({ onPress, children, style }: Props) => {
	return (
		<TouchableOpacity
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
