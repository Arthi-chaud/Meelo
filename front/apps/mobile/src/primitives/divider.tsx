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

import { View } from "react-native";
import type { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";
import { StyleSheet } from "react-native-unistyles";
import type { RequireExactlyOne } from "type-fest";

const styles = StyleSheet.create((theme) => ({
	container: {
		variants: {
			variant: { withInsets: {}, default: {} },
			direction: {
				horizontal: { width: "100%" },
				vertical: { height: "100%" },
			},
		},
		compoundVariants: [
			{
				direction: "horizontal",
				variant: "withInsets",
				styles: {
					paddingHorizontal: theme.gap(2),
				},
			},

			{
				direction: "vertical",
				variant: "withInsets",
				styles: {
					paddingVertical: theme.gap(2),
				},
			},
		],
	},
	box: {
		backgroundColor: theme.colors.divider,
		variants: {
			variant: { withInsets: {}, default: {} },
			direction: {
				horizontal: {
					width: "100%",
					height: 1,
				},
				vertical: {
					height: "100%",
					width: 1,
				},
			},
		},
	},
}));

type DividerProps = {
	withInsets?: true;
	containerProps?: ViewProps;
	boxProps?: ViewProps;
} & RequireExactlyOne<Record<"h" | "v", boolean>>;

export const Divider = ({ withInsets, ...props }: DividerProps) => {
	styles.useVariants({
		variant: withInsets ? "withInsets" : undefined,
		direction: props.v ? "vertical" : "horizontal",
	});
	return (
		<View
			{...props.containerProps}
			style={[styles.container, props.containerProps?.style]}
		>
			<View
				{...props.boxProps}
				style={[styles.box, props.boxProps?.style]}
			/>
		</View>
	);
};
