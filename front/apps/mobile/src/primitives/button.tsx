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

import {
	Pressable,
	type ButtonProps as RNButtonProps,
	Text,
	type TextProps,
	View,
} from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";

const styles = StyleSheet.create((theme) => ({
	container: {
		variants: {
			variant: {
				outlined: {},
				filled: {},
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
	},
	button: {
		paddingVertical: theme.gap(1),
		paddingHorizontal: theme.gap(2.5),
		borderRadius: theme.borderRadius, //TODO
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
				fill: {},
				fitContent: {},
			},
		},
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

type ButtonProps = UnistylesVariants<typeof styles> & {
	labelProps?: TextProps;
	buttonProps?: RNButtonProps;
	onPress: RNButtonProps["onPress"];
	title: RNButtonProps["title"];
};

export const Button = (props: ButtonProps) => {
	styles.useVariants({
		width: props.width ?? "fitContent",
		variant: props.variant ?? "filled",
	});
	return (
		<View style={styles.container}>
			<Pressable
				{...props.buttonProps}
				onPress={props.onPress}
				style={styles.button}
			>
				<Text style={styles.label}>{props.title}</Text>
			</Pressable>
		</View>
	);
};
