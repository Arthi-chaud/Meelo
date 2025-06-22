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
import type { Icon } from "@/ui/icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Blurhash } from "react-native-blurhash";
import Animated, {
	FadeOut,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useAPI } from "~/api";

type Props = {
	illustration: IllustrationModel | undefined | null;
	fallbackIcon?: Icon;
	variant?: "fill" | "circle";
};

const styles = StyleSheet.create((theme) => ({
	outerContainer: {
		aspectRatio: 1,
		overflow: "hidden",
		flex: 1,
		alignItems: "center",
		justifyContent: "flex-end",
	},
	innerContainer: {
		backgroundColor: theme.colors.skeleton,
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

// TODO Make tall images fit container
// TODO use image size preset

export const Illustration = ({
	illustration,
	fallbackIcon,
	variant,
}: Props) => {
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
			blurhashOpacity.value = withTiming(1, { duration: 100 });
		}
	}, [blurhashLoaded]);
	return (
		<View style={styles.outerContainer}>
			<View
				style={[
					styles.innerContainer,
					{
						aspectRatio: innerAspectRatio,
					},
				]}
			>
				{illustration && imageStatus !== "error" && (
					<>
						{imageStatus !== "done" && (
							<Animated.View
								exiting={FadeOut}
								style={[styles.slot]}
							>
								<Blurhash
									decodeAsync
									style={[blurhashFadeIn, styles.slotContent]}
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
								contentFit="cover"
								decodeFormat="rgb"
								onDisplay={() => setImageStatus("done")}
								onError={() => {
									setImageStatus("error");
								}}
								source={{
									headers: {
										Authorization: `Bearer ${api.accessToken}`,
									},
									uri: api.getIllustrationURL(
										illustration.url,
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
