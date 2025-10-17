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

import Image, {
	type FastImageProps as ImageProps,
} from "@d11/react-native-fast-image";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

const styles = StyleSheet.create((_theme) => ({
	image: {
		flex: 1,
		width: "100%",
	},
	icon: { aspectRatio: 1, height: "100%" },
}));

const BannerBase = withUnistyles(
	Image,
	(theme) =>
		({
			priority: Image.priority.high,
			resizeMode: "contain",
			source:
				theme.name === "dark"
					? require("../../assets/banner1_white.png")
					: require("../../assets/banner1_black.png"),
		}) as const,
);

export const Banner = (props: Pick<ImageProps, "style">) => {
	return <BannerBase style={[styles.image, props.style]} />;
};

const IconBase = withUnistyles(
	Image,
	(theme) =>
		({
			priority: Image.priority.high,
			resizeMode: "contain",
			source:
				theme.name === "light"
					? require("../../assets/icon-black.png")
					: require("../../assets/icon-white.png"),
		}) as const,
);

export const Icon = (props: Pick<ImageProps, "style">) => {
	return <IconBase style={[styles.icon, props.style]} />;
};
