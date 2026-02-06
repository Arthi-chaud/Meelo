import { type Href, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet } from "react-native-unistyles";
import type { Icon as IconType } from "@/ui/icons";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { LoadableText } from "./loadable_text";

type Props = {
	title: string | undefined;
	onPress?: () => void;
	href?: Href;
	icon?: IconType;
	filled?: boolean;
	disabled?: boolean;
};

export const Chip = ({
	title,
	onPress,
	href,
	filled,
	icon,
	disabled,
}: Props) => {
	styles.useVariants({
		filled: filled ?? false,
		disabled: disabled ?? false,
	});
	const router = useRouter();
	const pressCallback = useCallback(() => {
		onPress?.();
		if (href) {
			router.navigate(href);
		}
	}, [onPress, href]);

	return (
		<Pressable
			onPress={pressCallback}
			style={styles.chip}
			disabled={disabled}
		>
			{icon && <Icon icon={icon} style={styles.chipIcon} />}
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
		borderRadius: theme.borderRadius * 3,
		flexDirection: "row",
		gap: theme.gap(1),
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: theme.colors.text.primary,
		variants: {
			disabled: {
				true: { opacity: 0.5 },
				false: {},
			},
			filled: {
				true: {
					backgroundColor: theme.colors.text.primary,
				},
				false: {},
			},
		},
		paddingVertical: theme.gap(0.5),
		paddingHorizontal: theme.gap(1.5),
	},
	chipIcon: {
		size: theme.fontSize.rem(1),
		variants: {
			filled: {
				true: {
					color: theme.colors.text.onAccentSurface,
				},
				false: {
					color: theme.colors.text.primary,
				},
			},
		},
	},
	chipText: {
		fontSize: theme.fontSize.rem(0.8),
		variants: {
			filled: {
				true: {
					color: theme.colors.text.onAccentSurface,
				},
				false: {
					color: theme.colors.text.primary,
				},
			},
		},
	},
}));
