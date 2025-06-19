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
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useAPI } from "~/api";

type Props = {
	illustration: IllustrationModel | undefined | null;
	fallbackIcon?: Icon;
};

const styles = StyleSheet.create((theme) => ({
	outerContainer: {
		aspectRatio: 1,
		flex: 1,
		justifyContent: "flex-end",
	},
	innerContainer: {
		backgroundColor: theme.colors.skeleton,
		borderRadius: theme.borderRadius,
		overflow: "hidden",
	},
	slot: { width: "100%", height: "100%", position: "absolute", top: 0 },
	slotContent: { flex: 1 },
	fallbackContainer: {
		flex: 1,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
}));

export const Illustration = ({ illustration, fallbackIcon }: Props) => {
	const api = useAPI();
	const innerAspectRatio = useMemo(
		() => illustration?.aspectRatio ?? 1,
		[illustration],
	);

	const [imageStatus, setImageStatus] = useState<
		"done" | "loading" | "error"
	>("loading");
	const imageOpacity = useSharedValue(0);
	const imageFadeIn = useAnimatedStyle(() => ({
		opacity: imageOpacity.value,
	}));

	const [blurhashLoaded, setBlurhashLoaded] = useState(false);
	const blurhashOpacity = useSharedValue(0);
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
			imageOpacity.value = withTiming(1, { duration: 500 });
			blurhashOpacity.value = withTiming(0, { duration: 500 });
		} else if (imageStatus === "error") {
			fallbackOpacity.value = withTiming(1, { duration: 500 });
			blurhashOpacity.value = withTiming(0, { duration: 500 });
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
					{ aspectRatio: innerAspectRatio },
				]}
			>
				{illustration && imageStatus !== "error" && (
					<>
						<Animated.View style={[blurhashFadeIn, styles.slot]}>
							<Blurhash
								decodeAsync
								style={styles.slotContent}
								onLoadEnd={() => setBlurhashLoaded(true)}
								blurhash={illustration.blurhash}
								decodeWidth={16}
								decodeHeight={16}
							/>
						</Animated.View>

						<Animated.View style={[imageFadeIn, styles.slot]}>
							<Image
								style={styles.slotContent}
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
