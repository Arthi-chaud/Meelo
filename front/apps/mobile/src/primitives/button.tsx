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

import { useCallback } from "react";
import {
	Pressable,
	type ButtonProps as RNButtonProps,
	Text,
	type TextStyle,
	View,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import type { RequireExactlyOne } from "type-fest";
import type { Icon as IconType } from "@/ui/icons";
import { animations } from "~/theme";
import { Icon } from "./icon";

type ButtonProps = UnistylesVariants<typeof styles> & {
	labelStyle?: TextStyle;
	size?: "normal" | "small";
	containerStyle?: ViewStyle;
} & RequireExactlyOne<{
		onPress: NonNullable<RNButtonProps["onPress"]>;
		propagateToParent: true;
	}> &
	(
		| {
				icon?: IconType;
				iconPosition?: "left" | "right";
				title?: RNButtonProps["title"];
		  }
		| {
				icon?: never;
				iconPosition?: never;
				title: RNButtonProps["title"];
		  }
	);

export const Button = (props: ButtonProps) => {
	const scale = useSharedValue<number>(1);
	const handlePress = useCallback(() => {
		scale.value = animations.pressable.scaleOnPress;
	}, []);
	const handleRelease = useCallback(() => {
		scale.value = 1;
	}, []);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{
				scale: withTiming(scale.value, animations.pressable.config),
			},
		],
	}));
	styles.useVariants({
		size: props.size ?? "normal",
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
				android_disableSound
				style={[styles.content]}
				onPress={!props.disabled ? props.onPress : undefined}
				onPressIn={!props.disabled ? handlePress : undefined}
				onPressOut={!props.disabled ? handleRelease : undefined}
			>
				{props.icon && props.iconPosition !== "right" ? (
					<Icon
						icon={props.icon}
						style={[styles.label as any, styles.icon]}
					/>
				) : undefined}
				{props.title && (
					<Text style={[styles.label, props.labelStyle]}>
						{props.title}
					</Text>
				)}
				{props.icon && props.iconPosition === "right" ? (
					<Icon
						icon={props.icon}
						style={[styles.label as any, styles.icon]}
					/>
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
	content: {
		flexDirection: "row",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		variants: {
			size: {
				small: {
					gap: theme.gap(1),
					paddingVertical: theme.gap(0.75),
					paddingHorizontal: theme.gap(1.25),
				},
				normal: {
					gap: theme.gap(1),
					paddingVertical: theme.gap(1),
					paddingHorizontal: theme.gap(2),
				},
			},
			width: {
				fill: { width: "100%" },
				fitContent: { width: "auto" },
			},
			disabled: { true: {}, default: {} },
			variant: {
				outlined: {},
				filled: {},
			},
		},
	},
	icon: {
		marginBottom: 2,
		variants: {
			size: {
				small: { size: theme.fontSize.rem(1) } as unknown as {},
				normal: {},
			},
			width: {
				fill: {},
				fitContent: {},
			},
			disabled: { true: {}, default: {} },
			variant: {
				outlined: {},
				filled: {},
			},
		},
	},
	label: {
		...theme.fontStyles.medium,
		textAlign: "center",
		variants: {
			size: {
				small: {
					fontSize: theme.fontSize.rem(0.9),
				},
				normal: {
					fontSize: theme.fontSize.rem(1),
				},
			},
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
