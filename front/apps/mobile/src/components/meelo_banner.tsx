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

import { Image } from "expo-image";
import type { ImageProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useColorScheme } from "~/hooks/color-scheme";

const styles = StyleSheet.create((_theme) => ({
	image: {
		flex: 1,
		width: "100%",
	},
}));

export const MeeloBanner = (props: Pick<ImageProps, "style">) => {
	const [colorScheme, _] = useColorScheme();

	return (
		<Image
			priority={"high"}
			contentFit="contain"
			style={[styles.image, props.style]}
			source={
				colorScheme === "dark"
					? require("../../assets/banner1_white.png")
					: require("../../assets/banner1_black.png")
			}
		/>
	);
};
