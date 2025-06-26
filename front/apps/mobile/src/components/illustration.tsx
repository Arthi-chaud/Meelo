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

import type IllustrationModel from "@/models/illustration";
import type { IllustrationQuality } from "@/models/illustration";
import type { Icon } from "@/ui/icons";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Blurhash } from "react-native-blurhash";
// import { Image } from "expo-image";
import Image from "react-native-fast-image";
import Animated, {
	FadeOut,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";
import { useAPI } from "~/api";

type Props = {
	illustration: IllustrationModel | undefined | null;
	fallbackIcon?: Icon;
	quality: IllustrationQuality;
	variant?: "fill" | "circle";
	// If true, the blurhash will not be ecoded/displayed.
	// Instead it will use the color from the illustration model as a place holder
	// To enhance performance in infinite lists
	simpleColorPlaceholder?: true;
};

// TODO Make tall images fit container
// TODO use image size preset

export const Illustration = ({
	illustration,
	fallbackIcon,
	quality,
	variant,
	simpleColorPlaceholder,
}: Props) => {
	const theme = useAnimatedTheme();
	const api = useAPI();
	const innerAspectRatio = useMemo(
		() =>
			variant === "fill" || variant === "circle"
				? 1
				: (illustration?.aspectRatio ?? 1),
		[illustration],
	);
	styles.useVariants({
		imageType: innerAspectRatio > 1 ? "wide" : "tall",
		shape: variant === "circle" ? "circle" : undefined,
	});
	const [imageStatus, setImageStatus] = useState<
		"done" | "loading" | "error"
	>("loading");
	const imageOpacity = useSharedValue(0);
	const imageFadeIn = useAnimatedStyle(() => ({
		opacity: imageOpacity.value,
	}));

	const [blurhashLoaded, setBlurhashLoaded] = useState(false);
	const blurhashOpacity = useSharedValue(0);
	//Note: we only set the opacity to 1
	//We rely on the existing animation to handle the fadeout
	const blurhashFadeIn = useAnimatedStyle(() => ({
		opacity: blurhashOpacity.value,
	}));

	const FallbackIcon = withUnistyles(
		fallbackIcon ?? View,
		(theme) =>
			({
				color: theme.colors.text.secondary,
			}) as any,
	);
	const fallbackOpacity = useSharedValue(0);
	const fallbackFadeIn = useAnimatedStyle(() => ({
		opacity: fallbackOpacity.value,
	}));
	//Attempt at recycling
	//TODO Finish
	useEffect(() => {
		fallbackOpacity.value = 0;
		blurhashOpacity.value = 0;
		imageOpacity.value = 0;
		setImageStatus("loading");
	}, [illustration]);

	useEffect(() => {
		if (imageStatus === "done") {
			imageOpacity.value = withTiming(1);
		} else if (imageStatus === "error") {
			fallbackOpacity.value = withTiming(1);
		}
	}, [imageStatus]);
	useEffect(() => {
		if (illustration === null) {
			fallbackOpacity.value = withTiming(1);
		}
	}, [illustration]);
	useEffect(() => {
		if (blurhashLoaded) {
			blurhashOpacity.value = withTiming(1, {
				duration: theme.value.animations.fades.blurhash,
			});
		}
	}, [blurhashLoaded]);
	return (
		<View style={styles.outerContainer}>
			<View
				style={[
					{
						aspectRatio: innerAspectRatio,
					},
					styles.innerContainer(
						simpleColorPlaceholder
							? illustration?.colors.at(0)
							: undefined,
					),
				]}
			>
				{illustration && imageStatus !== "error" && (
					<>
						{!simpleColorPlaceholder && imageStatus !== "done" && (
							<Animated.View
								exiting={FadeOut}
								style={[styles.slot]}
							>
								<Blurhash
									decodeAsync
									style={[
										blurhashFadeIn,
										styles.slotContent,
										styles.blurhash,
									]}
									onLoadEnd={() => setBlurhashLoaded(true)}
									blurhash={illustration.blurhash}
									decodeWidth={16}
									decodeHeight={16}
								/>
							</Animated.View>
						)}

						<Animated.View style={[imageFadeIn, styles.slot]}>
							<Image
								style={[styles.slotContent]}
								onLoad={() => setImageStatus("done")}
								resizeMode="cover"
								onError={() => {
									setImageStatus("error");
								}}
								source={{
									headers: {
										Authorization: `Bearer ${api.accessToken}`,
									},
									uri: api.getIllustrationURL(
										illustration.url,
										quality,
									),
								}}
							/>
						</Animated.View>
					</>
				)}
				{(!illustration || imageStatus === "error") && (
					<Animated.View
						style={[
							fallbackFadeIn,
							styles.fallbackContainer,
							styles.slot,
						]}
					>
						<FallbackIcon />
					</Animated.View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	outerContainer: {
		aspectRatio: 1,
		overflow: "hidden",
		flex: 1,
		alignItems: "center",
		justifyContent: "flex-end",
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
	fallbackContainer: {
		flex: 1,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
}));
