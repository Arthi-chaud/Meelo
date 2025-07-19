import type { ComponentProps } from "react";
import { LoadableText } from "./loadable_text";
import { Pressable } from "~/primitives/pressable";
import type { ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
	onPress?: () => void;
	style?: ViewStyle;
} & Omit<ComponentProps<typeof LoadableText>, "variant">;

export const SectionHeader = ({ onPress, style, ...textProps }: Props) => {
	return (
		<Pressable
			onPress={() => onPress?.()}
			disabled={!onPress}
			style={[styles.header, style]}
		>
			<LoadableText {...textProps} variant="h4" />
		</Pressable>
	);
};

const styles = StyleSheet.create((theme) => ({
	header: {
		marginLeft: theme.gap(1),
		marginBottom: theme.gap(1),
	},
}));
