import { BottomSheetHandle, useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useNavigation } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { LyricsIcon, PlayerIcon, PlaylistIcon } from "@/ui/icons";
import { useQuery } from "~/api";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { breakpoints } from "~/theme";
import { getSongWithLyrics } from "../queries";
import { currentTrackAtom } from "../state";
import { ColorBackground } from "../utils";
import { Lyrics } from "./lyrics";
import { Main } from "./main";
import { Queue } from "./queue";
import { ExpandedPlayerModalKey } from "./slot";

const Tabs = ["main", "lyrics", "queue"] as const;
type Tab = (typeof Tabs)[number];

export const ExpandedPlayer = () => {
	const { dismiss } = useBottomSheetModal();
	const insets = useSafeAreaInsets();
	const [tab, setTab] = useState<Tab>("main");
	const navigation = useNavigation();

	useEffect(() => {
		const callback = () => dismiss(ExpandedPlayerModalKey);
		navigation.addListener("state", callback);
		return () => navigation.removeListener("state", callback);
	}, []);

	return (
		<View
			style={[
				styles.root,
				{ paddingTop: insets.top, paddingBottom: insets.bottom },
			]}
		>
			<Handle />
			<ColorBackground />
			<View style={styles.content}>
				<View style={styles.tab}>
					{tab === "main" && <Main />}
					{tab === "lyrics" && <Lyrics />}
					{tab === "queue" && <Queue />}
				</View>
				<Footer selectedTab={tab} onTabChange={setTab} />
			</View>
		</View>
	);
};

const Handle = withUnistyles(BottomSheetHandle, (theme) => ({
	indicatorStyle: { backgroundColor: theme.colors.text.primary },
}));

const Footer = ({
	selectedTab,
	onTabChange,
}: {
	selectedTab: Tab;
	onTabChange: (t: Tab) => void;
}) => {
	const currentTrack = useAtomValue(currentTrackAtom);
	// If current track is video only, disable lyrics tab
	const { data: song } = useQuery(
		getSongWithLyrics,
		currentTrack?.track.songId ?? undefined,
	);
	const lyricsTabIsDisabled = useMemo(() => {
		const trackHasNoSong = currentTrack?.track.songId === null;
		const trackHasLyrics = song && song.lyrics !== null;
		return trackHasNoSong || !trackHasLyrics;
	}, [song, currentTrack]);

	return (
		<View style={styles.footer}>
			<Divider h />
			<View style={styles.footerButtons}>
				{(
					[
						["main", PlayerIcon],
						["lyrics", LyricsIcon],
						["queue", PlaylistIcon],
					] as const
				).map(([tab, icon]) => (
					<Pressable
						onPress={() => onTabChange(tab)}
						key={tab}
						disabled={tab === "lyrics" && lyricsTabIsDisabled}
					>
						<Icon
							icon={icon}
							style={
								tab === "lyrics" && lyricsTabIsDisabled
									? styles.disabledFooterButton
									: undefined
							}
							variant={selectedTab === tab ? "Bold" : undefined}
						/>
					</Pressable>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		flex: 1,
		width: "100%",
	},
	content: {
		width: "100%",
		flex: 1,
		paddingTop: theme.gap(2),
		paddingHorizontal: theme.gap(2),
	},
	tab: {
		width: "100%",
		alignItems: "center",
		flex: 1,
	},
	footer: { width: "100%", alignItems: "center" },
	footerButtons: {
		paddingVertical: theme.gap(2),
		width: "100%",
		maxWidth: breakpoints.md,
		flexDirection: "row",
		justifyContent: "space-evenly",
	},
	disabledFooterButton: { color: theme.colors.text.secondary },
}));
