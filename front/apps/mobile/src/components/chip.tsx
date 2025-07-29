import { type Href, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet } from "react-native-unistyles";
import { Pressable } from "~/primitives/pressable";
import { LoadableText } from "./loadable_text";

type Props = {
	title: string | undefined;
	onPress?: () => void;
	href?: Href;
	filled?: boolean;
};

export const Chip = ({ title, onPress, href, filled }: Props) => {
	styles.useVariants({ filled: filled ?? false });
	const router = useRouter();
	const pressCallback = useCallback(() => {
		onPress?.();
		if (href) {
			router.push(href);
		}
	}, [onPress, href]);

	return (
		<Pressable onPress={pressCallback} style={styles.chip}>
			<LoadableText
				content={title}
				skeletonWidth={5}
				style={styles.chipText}
				variant="subtitle"
			/>
		</Pressable>
	);
};

const styles = StyleSheet.create((theme) => ({
	chip: {
		borderWidth: 1,
		borderRadius: theme.borderRadius * 3,
		variants: {
			filled: {
				true: {
					backgroundColor: theme.colors.text.secondary,
					borderColor: theme.colors.text.secondary,
				},
				false: {
					borderColor: theme.colors.text.secondary,
				},
			},
		},
		paddingVertical: theme.gap(0.5),
		paddingHorizontal: theme.gap(1.5),
	},
	chipText: {
		fontSize: theme.fontSize.rem(0.8),
		variants: {
			filled: {
				true: {
					color: theme.colors.text.onAccentSurface,
				},
				false: {},
			},
		},
	},
}));
