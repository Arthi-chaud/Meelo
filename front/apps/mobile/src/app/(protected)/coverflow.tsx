import * as Device from "expo-device";
import { Stack, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import type { AlbumWithRelations } from "@/models/album";
import { formatArtists_ } from "@/utils/format-artists";
import { useInfiniteQuery } from "~/api";
import {
	BackgroundGradient,
	useSetKeyIllustration,
} from "~/components/background-gradient";
import { Coverflow } from "~/components/coverflow";
import { Illustration } from "~/components/illustration";
import { usePickArtistModal } from "~/components/pick-artist";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { coverflowQueryAtom } from "~/state/coverflow";
import { animations } from "~/theme";

export default function CoverflowView() {
	const isMobile = Device.deviceType !== Device.DeviceType.TABLET;
	const { t } = useTranslation();
	const router = useRouter();
	const query = useAtomValue(coverflowQueryAtom);
	const { items, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(() => query!); // TODO:
	const LOADNEXT_THRESHOLD = 10;
	useEffect(() => {
		if (items?.length === 0) {
			router.back();
		}
	}, [query, items]);

	useEffect(() => {
		if (isMobile) {
			ScreenOrientation.unlockAsync().then(() =>
				ScreenOrientation.lockAsync(
					ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
				),
			);
		}
		return () => {
			if (isMobile) {
				ScreenOrientation.unlockAsync().then(() =>
					ScreenOrientation.lockAsync(
						ScreenOrientation.OrientationLock.PORTRAIT_UP,
					),
				);
			}
		};
	}, []);
	const [selectedItem, setSelectedItem] = useState<
		AlbumWithRelations<"artists" | "illustration"> | undefined
	>(items?.at(0));

	const { openModal: openPickArtistModal } = usePickArtistModal(
		selectedItem?.artists,
	);
	const textOpacity = useSharedValue(1);
	useSetKeyIllustration(selectedItem);
	return (
		<>
			<Stack.Screen
				options={{
					orientation: "landscape",
					headerShown: false,
					navigationBarHidden: true,
					animation: "fade",
					gestureEnabled: false,
				}}
			/>

			<View style={styles.root}>
				<BackgroundGradient />
				<Coverflow
					style={styles.coverflow}
					config={{ spacing: 175, rotation: 70 }}
					data={items ?? []}
					itemKey={(album) => album.slug}
					onScroll={(pos) => {
						if (
							!isFetchingNextPage &&
							hasNextPage &&
							pos >= (items?.length ?? 0) - LOADNEXT_THRESHOLD
						) {
							fetchNextPage();
						}
						textOpacity.value = withTiming(0, animations.fades);
					}}
					onChange={(idx) => {
						setSelectedItem(items?.at(idx));
						textOpacity.value = withTiming(1, animations.fades);
					}}
					renderItem={(album) => (
						<Illustration
							illustration={album.illustration}
							quality="high"
						/>
					)}
				/>
				<Animated.View style={[styles.text, { opacity: textOpacity }]}>
					{selectedItem && (
						<>
							<Pressable
								onPress={() => {
									router.dismissTo(
										`/releases/${selectedItem.masterId}`,
									);
								}}
							>
								<Text
									content={selectedItem.name ?? ""}
									variant="resourceTitle"
									numberOfLines={1}
								/>
							</Pressable>
							<Pressable
								disabled={selectedItem.artists.length === 0}
								onPress={() => {
									if (selectedItem.artists.length > 1) {
										openPickArtistModal();
									} else {
										router.dismissTo(
											`/artists/${selectedItem.artists[0].id}`,
										);
									}
								}}
							>
								<Text
									content={
										selectedItem.artists.length !== 0
											? formatArtists_(
													selectedItem.artists,
												)
											: t("compilationArtistLabel")
									}
									variant="secondaryTitle"
									numberOfLines={1}
								/>
							</Pressable>
						</>
					)}
				</Animated.View>
			</View>
		</>
	);
}

const styles = StyleSheet.create((theme) => ({
	root: {
		flex: 1,
		gap: theme.gap(3),
		paddingVertical: theme.gap(3),
		justifyContent: "center",
		alignItems: "center",
	},
	coverflow: {
		height: "70%",
		width: "100%",
		maxHeight: 3000,
	},
	text: {
		width: "80%",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
}));
