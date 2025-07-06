/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import type { Icon } from "@/ui/icons";
import { useCallback } from "react";
import {
	Pressable,
	type ButtonProps as RNButtonProps,
	Text,
	type TextProps,
	View,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import {
	StyleSheet,
	type UnistylesVariants,
	withUnistyles,
} from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";
import type { RequireExactlyOne } from "type-fest";

type ButtonProps = UnistylesVariants<typeof styles> & {
	labelProps?: TextProps;
	containerStyle?: ViewStyle;
} & RequireExactlyOne<{
		onPress: NonNullable<RNButtonProps["onPress"]>;
		propagateToParent: true;
	}> &
	(
		| {
				icon?: Icon;
				iconPosition?: "left" | "right";
				title?: RNButtonProps["title"];
		  }
		| {
				icon?: never;
				iconPosition?: never;
				title: RNButtonProps["title"];
		  }
	);

// Note: For the 'fitContent' variant to work, you may need to tweak the parent so that:
// - The button is in a row
// - The button is align to the center (?)
export const Button = (props: ButtonProps) => {
	const theme = useAnimatedTheme();
	const scale = useSharedValue<number>(1);
	const Leading = withUnistyles(props.icon ?? View);
	const handlePress = useCallback(() => {
		scale.value = theme.value.animations.pressable.scaleOnPress;
	}, []);
	const handleRelease = useCallback(() => {
		scale.value = 1;
	}, []);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{
				scale: withSpring(scale.value, {
					damping: theme.value.animations.pressable.damping,
					stiffness: theme.value.animations.pressable.stiffness,
				}),
			},
		],
	}));
	styles.useVariants({
		width: props.width ?? "fitContent",
		variant: props.variant ?? "filled",
		disabled: props.disabled ?? false,
	});
	const Container = props.propagateToParent ? View : Pressable;
	return (
		<Animated.View
			style={[styles.container, animatedStyle, props.containerStyle]}
		>
			<Container
				style={[styles.content]}
				onPress={!props.disabled ? props.onPress : undefined}
				onPressIn={!props.disabled ? handlePress : undefined}
				onPressOut={!props.disabled ? handleRelease : undefined}
			>
				{props.icon && props.iconPosition !== "right" ? (
					<Leading style={[styles.label as any, styles.icon]} />
				) : undefined}
				{props.title && <Text style={styles.label}>{props.title}</Text>}
				{props.icon && props.iconPosition === "right" ? (
					<Leading style={[styles.label as any, styles.icon]} />
				) : undefined}
			</Container>
		</Animated.View>
	);
};

const styles = StyleSheet.create((theme) => ({
	container: {
		elevation: 3,
		variants: {
			disabled: {
				true: {
					opacity: 0.5,
				},
				default: {},
			},
			variant: {
				outlined: {
					borderColor: theme.colors.button,
					backgroundColor: theme.colors.background,
					borderWidth: 2,
				},
				filled: {
					backgroundColor: theme.colors.button,
				},
			},
			width: {
				fill: {
					width: "100%",
					display: "flex",
					justifyContent: "center",
				},
				fitContent: {
					display: "flex",
					flexDirection: "row",
				},
			},
		},
		borderRadius: theme.borderRadius,
	},
	// Separate this to make sure the entire surface is clickable
	content: {
		paddingVertical: theme.gap(1),
		paddingHorizontal: theme.gap(2),
		flexDirection: "row",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1),
	},
	icon: { marginBottom: 2 },
	label: {
		...theme.fontStyles.medium,
		textAlign: "center",
		variants: {
			width: {
				fill: {},
				fitContent: {},
			},
			disabled: { true: {}, default: {} },
			variant: {
				outlined: {
					color: theme.colors.text.primary,
				},
				filled: {
					color: theme.colors.text.onAccentSurface,
				},
			},
		},
	},
}));
