import type { InfiniteQuery } from "@/api/query";
import type Illustration from "@/models/illustration";
import type { IllustratedResource } from "@/models/illustration";
import type Resource from "@/models/resource";
import { generateArray } from "@/utils/gen-list";
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
import {
	useDerivedValue,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";
import { accessTokenAtom } from "~/state/user";

//TODO Check it looks good in dark mode

export const keyIllustrationAtom = atom<Illustration | null>(null);

export const useSetKeyIllustration = (keyItem: IllustratedResource) => {
	const [keyIllustration, setKeyIllustration] = useAtom(keyIllustrationAtom);
	useEffect(() => {
		if (
			keyItem?.illustration &&
			keyItem.illustration.url !== keyIllustration?.url
		)
			setKeyIllustration(keyItem.illustration);
	}, [keyItem]);
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
	const accessToken = useAtomValue(accessTokenAtom);
	const keyIllustration = useAtomValue(keyIllustrationAtom);
	const currentColor1 = useSharedValue("transparent");
	const currentColor2 = useSharedValue("transparent");
	const currentColor3 = useSharedValue("transparent");
	const currentColor4 = useSharedValue("transparent");
	const currentColor5 = useSharedValue("transparent");

	useEffect(() => {
		if (!accessToken) {
			currentColor1.value = "transparent";
			currentColor2.value = "transparent";
			currentColor3.value = "transparent";
			currentColor4.value = "transparent";
			currentColor5.value = "transparent";
		}
	}, [accessToken]);
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
		<Canvas style={styles.canvas}>
			{generateArray(5, null).map((_, index) => {
				const cxRatio =
					index === 0 || index === 3 ? 0.1 : index === 4 ? 0 : 0.9;
				const cyRatio = index < 2 ? 0.9 : index < 4 ? 0.1 : 1;

				return (
					<FullScreenRect key={index}>
						<GradientEllipse
							uniProps={(_, rt) => ({
								c: vec(
									rt.screen.width * cxRatio,
									rt.screen.height * cyRatio,
								),
							})}
							colors={gradientColors[index]}
						/>
					</FullScreenRect>
				);
			})}
		</Canvas>
	);
};

const GradientEllipse = withUnistyles(RadialGradient, (_, rt) => {
	const r = Math.max(rt.screen.width, rt.screen.height) * 0.55;
	return {
		r,
	};
});

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

const styles = StyleSheet.create((theme) => ({
	canvas: {
		position: "absolute",
		left: 0,
		zIndex: -1, //TODO
		right: 0,
		top: 0,
		flex: 1,
		backgroundColor: theme.colors.background,
		opacity: theme.name === "light" ? 0.5 : 0.4,
		height: "100%",
	},
}));
