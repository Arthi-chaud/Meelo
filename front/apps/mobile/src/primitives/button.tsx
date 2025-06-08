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
	type TextProps,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

// TODO Make the button animation cooler/dynamic

type ButtonProps = UnistylesVariants<typeof styles> & {
	labelProps?: TextProps;
	buttonProps?: RNButtonProps;
	onPress: RNButtonProps["onPress"];
	title: RNButtonProps["title"];
};

export const Button = (props: ButtonProps) => {
	const scale = useSharedValue<number>(1);
	const handlePress = useCallback(() => {
		scale.value = 0.97;
	}, []);
	const handleRelease = useCallback(() => {
		scale.value = 1;
	}, []);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: withSpring(scale.value) }],
	}));
	styles.useVariants({
		width: props.width ?? "fitContent",
		variant: props.variant ?? "filled",
	});
	return (
		<Animated.View style={[styles.container, animatedStyle]}>
			<Pressable
				{...props.buttonProps}
				style={[styles.content]}
				onPress={props.onPress}
				onPressIn={handlePress}
				onPressOut={handleRelease}
			>
				<Text style={styles.label}>{props.title}</Text>
			</Pressable>
		</Animated.View>
	);
};

const styles = StyleSheet.create((theme) => ({
	container: {
		variants: {
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
		paddingHorizontal: theme.gap(2.5),
	},
	label: {
		...theme.fontStyles.medium,
		fontSize: theme.fontSize.rem(1.5),
		textAlign: "center",
		variants: {
			width: {
				fill: {},
				fitContent: {},
			},
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
