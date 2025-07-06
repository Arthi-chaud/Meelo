import type { InfiniteQuery } from "@/api/query";
import type Illustration from "@/models/illustration";
import type { IllustratedResource } from "@/models/illustration";
import type Resource from "@/models/resource";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { atom, useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";

//TODO Check it looks good in dark mode
//TODO Animation on transition

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

export const BackgroundGradient = () => {
	const keyIllustration = useAtomValue(keyIllustrationAtom);
	const sortedColors = useMemo(
		() => keyIllustration?.colors.sort().reverse(),
		[keyIllustration],
	);
	if (sortedColors?.length !== 5) {
		return null;
	}
	return (
		<LinearGradient
			// Background Linear Gradient
			colors={sortedColors as any}
			style={styles.gradient}
		/>
	);
};

const styles = StyleSheet.create((theme) => ({
	gradient: {
		position: "absolute",
		left: 0,
		// zIndex: -1, //TODO
		right: 0,
		top: 0,
		backgroundColor: theme.colors.background,
		opacity: theme.name === "light" ? 0.5 : 0.4,
		height: "100%",
	},
}));
