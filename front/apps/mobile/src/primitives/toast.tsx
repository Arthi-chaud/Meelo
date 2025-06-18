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

import { CheckIcon, ErrorIcon } from "@/ui/icons";
import { Pressable, View } from "react-native";
import { StyleSheet, type UnistylesVariants } from "react-native-unistyles";
import type { ToastConfigParams } from "toastify-react-native/utils/interfaces";
import { Text } from "~/primitives/text";

export const Toast = ({
	text1,
	variant,
	hide,
}: ToastConfigParams & UnistylesVariants<typeof styles>) => {
	const Icon = variant === "success" ? CheckIcon : ErrorIcon;
	styles.useVariants({ variant });
	return (
		<Pressable style={styles.root} onPress={hide}>
			<View style={styles.icon}>
				<Icon variant="Bold" style={styles.icon} />
			</View>
			<Text variant="subtitle" style={styles.text}>
				{text1}
			</Text>
		</Pressable>
	);
};

const styles = StyleSheet.create((theme, rt) => ({
	root: {
		//TODO Max width
		width: rt.screen.width - theme.gap(1 * 2),
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius,
		padding: theme.gap(2),
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		elevation: 10,
	},
	icon: {
		variants: {
			variant: {
				success: { color: theme.colors.success },
				error: { color: theme.colors.error },
			},
		},
		aspectRatio: 1,
	},
	text: {
		flex: 1,
		fontSize: theme.fontSize.rem(1.5),
	},
}));
