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

import type { ReactNode } from "react";
import {
	Text as RNText,
	type TextProps as RNTextProps,
	View,
} from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import type { RequireExactlyOne } from "type-fest";

const styles = StyleSheet.create((theme) => ({
	text: {
		fontSize: theme.fontSize.default, // to fix typing
		variants: {
			color: {
				primary: { color: theme.colors.text.primary },
				secondary: { color: theme.colors.text.secondary },
				default: { color: theme.colors.text.primary },
			},
			variant: {
				h1: {
					fontSize: theme.fontSize.rem(4),
					lineHeight: theme.fontSize.rem(4),
					...theme.fontStyles.light,
				},
				h2: {
					fontSize: theme.fontSize.rem(2.25),
					lineHeight: theme.fontSize.rem(2.75),
					overflow: "visible",
					...theme.fontStyles.semiBold,
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
					lineHeight: theme.fontSize.rem(1.25),
					...theme.fontStyles.medium,
				},
				body: {
					fontSize: theme.fontSize.rem(1),
					lineHeight: theme.fontSize.rem(1.125),
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
		<RNText
			{...props}
			style={[styles.text, props.style]}
			android_hyphenationFrequency={"normal"}
		>
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
	styles.useVariants({ variant: props.variant ?? "body" });
	return (
		<View
			style={[
				styles.skeleton,
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
		</View>
	);
};
