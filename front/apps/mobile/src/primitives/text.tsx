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

import { type ReactNode, useEffect } from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
	Easing,
} from "react-native-reanimated";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";
import type { RequireExactlyOne } from "type-fest";

const styles = StyleSheet.create((theme) => ({
	text: {
		variants: {
			color: {
				primary: { color: theme.colors.text.primary },
				secondary: { color: theme.colors.text.secondary },
				default: { color: theme.colors.text.primary },
			},
			variant: {
				h1: {
					fontSize: theme.fontSize.rem(4),
					...theme.fontStyles.light,
				},
				h2: {
					fontSize: theme.fontSize.rem(2.25),
					...theme.fontStyles.light,
				},
				h3: {
					fontSize: theme.fontSize.rem(1.875),
					...theme.fontStyles.regular,
				},
				h4: {
					fontSize: theme.fontSize.rem(1.5),
					...theme.fontStyles.regular,
				},
				h5: {
					fontSize: theme.fontSize.rem(1.25),
					...theme.fontStyles.regular,
				},
				h6: {
					fontSize: theme.fontSize.rem(1.125),
					...theme.fontStyles.medium,
				},
				body: {
					fontSize: theme.fontSize.rem(1),
					...theme.fontStyles.regular,
				},
				subtitle: {
					fontSize: theme.fontSize.rem(1),
					...theme.fontStyles.medium,
				},
			},
		},
	},
	skeleton: {
		// From MUI
		backgroundColor: theme.colors.skeleton,
		alignSelf: "flex-start",
		borderRadius: theme.borderRadius,
	},
}));

type TextProps = UnistylesVariants<typeof styles> &
	RNTextProps &
	RequireExactlyOne<{
		content: string;
		children: ReactNode;
	}>;

export const Text = ({ content, children, ...props }: TextProps) => {
	styles.useVariants({
		variant: props.variant,
		color: props.color,
	});
	return (
		<RNText {...props} style={[styles.text, props.style]}>
			{content ?? children}
		</RNText>
	);
};

export const TextSkeleton = (
	props: Pick<UnistylesVariants<typeof styles>, "variant"> & {
		// If number, represents a number of character to
		width: `${number}%` | number;
	},
) => {
	styles.useVariants({ variant: props.variant });
	const theme = useAnimatedTheme();
	const opacity = useSharedValue(1);
	const pulseAnimation = useAnimatedStyle(
		() => ({
			opacity: opacity.value,
		}),
		[],
	);
	useEffect(() => {
		opacity.value = withRepeat(
			withTiming(0.4, {
				duration: theme.value.pulse.timing,
				easing: Easing.ease,
			}),
			-1,
			true,
		);
	}, []);
	return (
		<Animated.View
			style={[
				styles.skeleton,
				pulseAnimation,
				{
					width:
						typeof props.width === "string"
							? props.width
							: styles.text.fontSize * (props.width / 2),
				},
			]}
		>
			{/* To ensure correct skeleton height */}
			<Text variant={props.variant}> </Text>
		</Animated.View>
	);
};
