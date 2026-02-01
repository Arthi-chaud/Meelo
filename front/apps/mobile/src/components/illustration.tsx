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

import Image from "@d11/react-native-fast-image";
import { useEffect, useMemo, useState } from "react";
import { View, type ViewStyle } from "react-native";
import { Blurhash } from "react-native-blurhash";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import type IllustrationModel from "@/models/illustration";
import type { IllustrationQuality } from "@/models/illustration";
import type { Icon as IconType } from "@/ui/icons";
import { useAPI } from "~/api";
import { Icon } from "~/primitives/icon";

type Props = {
	illustration: IllustrationModel | undefined | null;
	fallbackIcon?: IconType;
	dropShadow?: boolean;
	quality: IllustrationQuality;
	normalizedThumbnail?: boolean;
	variant?: "fill" | "circle" | "center";
	// If false, the blurhash will not be ecoded/displayed.
	// Instead it will use the color from the illustration model as a place holder
	// To enhance performance in infinite lists
	useBlurhash?: boolean;
	style?: ViewStyle;
};

export const Illustration = ({
	illustration,
	fallbackIcon,
	quality,
	variant,
	useBlurhash,
	dropShadow = false,
	normalizedThumbnail,
	style,
}: Props) => {
	const api = useAPI();
	const innerAspectRatio = useMemo(
		() =>
			normalizedThumbnail
				? 16 / 9
				: variant === "fill" || variant === "circle"
					? 1
					: (illustration?.aspectRatio ?? 1),
		[illustration],
	);
	styles.useVariants({
		hasShadow: dropShadow,
		imageType: innerAspectRatio > 1 ? "wide" : "tall",
		shape: variant === "circle" ? "circle" : undefined,
		align: variant === "center" ? "center" : "bottom",
		normalizedThumbnail: normalizedThumbnail ?? false,
	});
	const [loadStatus, setLoadStatus] = useState<"done" | "loading" | "error">(
		"loading",
	);
	const imageOpacity = useSharedValue(0);
	const fallbackOpacity = useSharedValue(0);

	const imageOpacityStyle = useAnimatedStyle(() => ({
		opacity: imageOpacity.value,
	}));
	const fallbackOpacityStyle = useAnimatedStyle(() => ({
		opacity: fallbackOpacity.value,
	}));

	useEffect(() => {
		// Whatever the new illustration props is,
		// we need to reset the blurhash and the image
		imageOpacity.value = 0;
		if (illustration === null) {
			fallbackOpacity.value = 1;
		} else {
			fallbackOpacity.value = 0;
		}
		setLoadStatus("loading");
	}, [illustration?.url]);
	return (
		<View style={[styles.outerContainer, style]}>
			<View
				style={[
					{
						aspectRatio: innerAspectRatio,
					},
					styles.innerContainer(
						!useBlurhash ? illustration?.colors.at(0) : undefined,
					),
					styles.shadow,
				]}
			>
				{illustration && loadStatus !== "error" && (
					<>
						{useBlurhash && (
							<View style={[styles.slot]}>
								<Blurhash
									decodeAsync
									style={[
										styles.slotContent,
										styles.blurhash,
									]}
									blurhash={illustration.blurhash}
									decodeWidth={16}
									decodeHeight={16}
								/>
							</View>
						)}

						<Animated.View style={[imageOpacityStyle, styles.slot]}>
							<Image
								style={[styles.slotContent]}
								onLoad={() => {
									imageOpacity.value = 1;
									setLoadStatus("done");
								}}
								resizeMode={
									variant === "circle" || normalizedThumbnail
										? "cover"
										: "contain"
								}
								onError={() => {
									setLoadStatus("error");
								}}
								source={{
									headers: api.getAuthHeaders(),
									uri: api.getIllustrationURL(
										illustration.url,
										quality,
									),
								}}
							/>
						</Animated.View>
					</>
				)}
				{(!illustration || loadStatus === "error") && (
					<Animated.View
						style={[
							fallbackOpacityStyle,
							styles.fallbackContainer,
							styles.slot,
						]}
					>
						{fallbackIcon && (
							<Icon
								icon={fallbackIcon}
								style={styles.fallbackIcon}
							/>
						)}
					</Animated.View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	outerContainer: {
		flex: 1,
		alignItems: "center",
		variants: {
			normalizedThumbnail: {
				true: { aspectRatio: 16 / 9 },
				false: { aspectRatio: 1 },
			},
			align: {
				center: { justifyContent: "center" },
				bottom: {
					justifyContent: "flex-end",
				},
			},
		},
	},
	innerContainer: (illustrationColor: string | undefined) => ({
		backgroundColor: illustrationColor ?? theme.colors.skeleton,
		borderRadius: theme.borderRadius,
		variants: {
			imageType: {
				tall: { height: "100%", width: undefined },
				wide: { height: undefined, width: "100%" },
			},
			shape: {
				circle: { borderRadius: 99999, overflow: "hidden" },
				default: {},
			},
		},
	}),
	blurhash: {
		backgroundColor: theme.colors.skeleton,
	},
	slot: {
		width: "100%",
		height: "100%",
		position: "absolute",
		bottom: 0,
		overflow: "hidden",
		borderRadius: theme.borderRadius,
	},
	slotContent: {
		flex: 1,
	},
	shadow: {
		variants: {
			hasShadow: {
				true: {
					boxShadow: theme.illustrationShadow,
				},
				false: {},
			},
		},
	},
	fallbackContainer: {
		flex: 1,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	fallbackIcon: {
		color: theme.colors.text.secondary,
	},
}));
