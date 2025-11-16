import {
	Canvas,
	RadialGradient,
	Rect,
	type RectProps,
	vec,
} from "@shopify/react-native-skia";
import { useFocusEffect } from "expo-router";
import { atom, useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import {
	useDerivedValue,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import type { InfiniteQuery } from "@/api/query";
import type Illustration from "@/models/illustration";
import type { IllustratedResource } from "@/models/illustration";
import type Resource from "@/models/resource";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery } from "~/api";
import { currentInstanceAtom } from "~/state/user";

export const keyIllustrationAtom = atom<Illustration | null>(null);

export const useSetKeyIllustration = (keyItem?: IllustratedResource) => {
	const [keyIllustration, setKeyIllustration] = useAtom(keyIllustrationAtom);
	useFocusEffect(() => {
		if (
			keyItem?.illustration &&
			keyItem.illustration.url !== keyIllustration?.url
		)
			setKeyIllustration(keyItem.illustration);
	});
};

export const useSetKeyIllustrationFromInfiniteQuery = <
	T extends Resource,
	T1 extends IllustratedResource,
>(
	query: InfiniteQuery<T, T1>,
) => {
	const { data } = useInfiniteQuery(() => query);
	const [keyIllustration, setKeyIllustration] = useAtom(keyIllustrationAtom);
	useFocusEffect(() => {
		const firstItem = data?.pages
			.at(0)
			?.items.find((item) => item.illustration !== null);
		if (
			firstItem?.illustration &&
			firstItem.illustration.url !== keyIllustration?.url
		)
			setKeyIllustration(firstItem.illustration);
	});
};

const transitionDuration = 300;

export const BackgroundGradient = () => {
	const currentInstance = useAtomValue(currentInstanceAtom);
	const keyIllustration = useAtomValue(keyIllustrationAtom);
	const currentColor1 = useSharedValue("transparent");
	const currentColor2 = useSharedValue("transparent");
	const currentColor3 = useSharedValue("transparent");
	const currentColor4 = useSharedValue("transparent");
	const currentColor5 = useSharedValue("transparent");

	useEffect(() => {
		if (!currentInstance) {
			currentColor1.value = "transparent";
			currentColor2.value = "transparent";
			currentColor3.value = "transparent";
			currentColor4.value = "transparent";
			currentColor5.value = "transparent";
		}
	}, [currentInstance]);
	useEffect(() => {
		if (keyIllustration) {
			currentColor1.value = withTiming(keyIllustration.colors[0], {
				duration: transitionDuration,
			});
			currentColor2.value = withTiming(keyIllustration.colors[1], {
				duration: transitionDuration,
			});
			currentColor3.value = withTiming(keyIllustration.colors[2], {
				duration: transitionDuration,
			});
			currentColor4.value = withTiming(keyIllustration.colors[3], {
				duration: transitionDuration,
			});
			currentColor5.value = withTiming(keyIllustration.colors[4], {
				duration: transitionDuration,
			});
		}
	}, [keyIllustration]);
	const gradientColor1 = useDerivedValue(() => {
		return [currentColor1.value, "transparent"];
	}, []);
	const gradientColor2 = useDerivedValue(() => {
		return [currentColor2.value, "transparent"];
	}, []);
	const gradientColor3 = useDerivedValue(() => {
		return [currentColor3.value, "transparent"];
	}, []);
	const gradientColor4 = useDerivedValue(() => {
		return [currentColor4.value, "transparent"];
	}, []);
	const gradientColor5 = useDerivedValue(() => {
		return [currentColor5.value, "transparent"];
	}, []);
	const gradientColors = useMemo(
		() => [
			gradientColor1,
			gradientColor2,
			gradientColor3,
			gradientColor4,
			gradientColor5,
		],
		[],
	);
	return (
		<View style={styles.root}>
			<StyledCanvas style={styles.canvas}>
				{generateArray(5, null).map((_, index) => {
					const cxRatio =
						index === 0 || index === 3
							? 0.1
							: index === 4
								? 0
								: 0.9;
					const cyRatio = index < 2 ? 0.9 : index < 4 ? 0.1 : 1;

					return (
						<FullScreenRect key={index}>
							<GradientEllipse
								uniProps={(_, rt) => ({
									c: vec(
										rt.screen.width * cxRatio,
										rt.screen.height * cyRatio,
									),
									r: Math.max(
										rt.screen.width,
										rt.screen.height,
									),
								})}
								colors={gradientColors[index]}
							/>
						</FullScreenRect>
					);
				})}
			</StyledCanvas>
		</View>
	);
};

const GradientEllipse = withUnistyles(RadialGradient);

const FullScreenRect = withUnistyles(
	Rect,
	(_theme, rt) =>
		({
			x: 0,
			y: 0,
			width: rt.screen.width,
			height: rt.screen.height,
		}) as RectProps,
);

const StyledCanvas = withUnistyles(Canvas);

const styles = StyleSheet.create((theme) => ({
	root: {
		position: "absolute",
		left: 0,
		zIndex: -1,
		right: 0,
		top: 0,
		height: "100%",
		backgroundColor: theme.colors.background,
	},
	canvas: {
		flex: 1,
		opacity: theme.name === "light" ? 0.5 : 0.4,
	},
}));
