import { BottomSheetHandle } from "@gorhom/bottom-sheet";
import { useAtomValue } from "jotai";
import { type ReactElement, useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { getSong } from "@/api/queries";
import { LyricsIcon, PlayerIcon, PlaylistIcon } from "@/ui/icons";
import { useQuery } from "~/api";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { breakpoints } from "~/theme";
import { currentTrackAtom } from "../state";
import { ColorBackground } from "../utils";
import { Lyrics } from "./lyrics";
import { Main } from "./main";

//TODO pause/play state

const Tabs = ["main", "lyrics", "playlist"] as const;
type Tab = (typeof Tabs)[number];

export const ExpandedPlayer = () => {
	const insets = useSafeAreaInsets();
	const [tab, setTab] = useState<Tab>("main");

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
				<View style={{ width: "100%", flex: 1 }}>
					{tab === "main" && <Main />}
					{tab === "lyrics" && <Lyrics />}
				</View>
				<Footer selectedTab={tab} onTabChange={setTab} />
			</View>
		</View>
	);
};

const Handle = BottomSheetHandle as unknown as () => ReactElement;

const Footer = ({
	selectedTab,
	onTabChange,
}: {
	selectedTab: Tab;
	onTabChange: (t: Tab) => void;
}) => {
	const currentTrack = useAtomValue(currentTrackAtom);
	// If current track is video only, disable lyrics tab
	// Note: it's the same query as the lyrics' tab
	const { data: song } = useQuery(
		(songId) => getSong(songId, ["lyrics"]),
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
						["playlist", PlaylistIcon],
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
		maxWidth: breakpoints.md,
		alignItems: "center",
	},
	footer: { width: "100%" },
	footerButtons: {
		paddingVertical: theme.gap(2),
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-evenly",
	},
	disabledFooterButton: { color: theme.colors.text.secondary },
}));
