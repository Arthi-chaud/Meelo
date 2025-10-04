import { useLocalSearchParams } from "expo-router";
import { useSetAtom } from "jotai";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { getGenres, getSong, getSongExternalMetadata } from "@/api/queries";
import type { ExternalMetadataSource } from "@/models/external-metadata";
import type Genre from "@/models/genre";
import type { Lyrics } from "@/models/lyrics";
import type Song from "@/models/song";
import { songTypeToTranslationKey } from "@/models/utils";
import { playTrackAtom, type TrackState } from "@/state/player";
import { LyricsIcon, PlayIcon, SongTypeIcon } from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery, useQuery } from "~/api";
import { useSetKeyIllustration } from "~/components/background-gradient";
import { Chip } from "~/components/chip";
import { EmptyState } from "~/components/empty-state";
import {
	ExternalMetadataDescription,
	ExternalMetadataSourceComponent,
} from "~/components/external-metadata";
import { LoadableText } from "~/components/loadable_text";
import { SongHeader } from "~/components/resource-header";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Text } from "~/primitives/text";

const tabs = ["lyrics", "infos"] as const;
type Tab = (typeof tabs)[number];

export default function SongPage() {
	const playTrack = useSetAtom(playTrackAtom);
	const { paddingTop, paddingBottom } = useRootViewStyle();
	const { id, tab: tabQuery } = useLocalSearchParams<{
		id: string;
		tab?: Tab;
	}>();
	const [currentTab, setCurrentTab] = useState(() => {
		if (!tabQuery || !tabs.includes(tabQuery)) {
			return tabs[0];
		}
		return tabQuery;
	});
	const { data: song } = useQuery(() =>
		getSong(id, [
			"artist",
			"illustration",
			"featuring",
			"lyrics",
			"master",
		]),
	);
	useSetKeyIllustration(song);
	const playButtonCallback = useCallback(() => {
		if (!song) {
			return;
		}
		const track: TrackState = {
			track: { ...song.master, illustration: song.illustration },
			artist: song.artist,
			featuring: song.featuring,
		};
		playTrack(track);
	}, [song]);

	return (
		<View style={{ paddingTop }}>
			<View style={styles.content}>
				<SongHeader song={song} />
				<View style={styles.playButton}>
					<Button
						title="Play"
						icon={PlayIcon}
						disabled={!song}
						onPress={playButtonCallback}
						containerStyle={styles.playButtonContent}
					/>
				</View>
				<TabComponent
					currentTab={currentTab}
					enabled={!!song}
					setCurrentTab={setCurrentTab}
				/>
				<Divider h withInsets />
				{song && (
					<ScrollView
						style={styles.content}
						contentContainerStyle={{ paddingBottom }}
					>
						{currentTab === "lyrics" && (
							<LyricsView
								lyrics={song?.lyrics}
								songName={song?.name}
							/>
						)}
						{currentTab === "infos" && <InfoView song={song} />}
					</ScrollView>
				)}
			</View>
		</View>
	);
}

const LyricsView = ({
	lyrics,
	songName,
}: {
	lyrics: Lyrics | undefined | null;
	songName: string | undefined;
}) => {
	const lowerSongName = songName?.toLowerCase();
	if (lyrics === null) {
		return (
			<View style={styles.tab}>
				<EmptyState icon={LyricsIcon} text="emptyState.lyrics" />
			</View>
		);
	}
	return (
		<View style={styles.tab}>
			{lyrics?.plain.split("\n").map((line, idx) => (
				<Text
					key={idx}
					content={line}
					style={styles.lyric}
					variant={
						lowerSongName &&
						line.toLowerCase().includes(lowerSongName)
							? "subtitle"
							: undefined
					}
				/>
			))}
		</View>
	);
};

const InfoView = ({ song }: { song: Song | undefined }) => {
	const { t } = useTranslation();
	const { items: genres } = useInfiniteQuery(
		(songId) => getGenres({ song: songId }),
		song?.id,
	);

	const { data: externalMetadata } = useQuery(
		(songId) => getSongExternalMetadata(songId),
		song?.id,
	);
	return (
		<View style={[styles.tab, styles.info]}>
			<View style={styles.row}>
				<Text content={`${t("song.songType")}:`} variant="subtitle" />
				<View style={styles.row}>
					{song && (
						<Icon
							icon={SongTypeIcon(song?.type)}
							style={styles.songTypeIcon}
						/>
					)}
					<LoadableText
						content={
							song
								? t(songTypeToTranslationKey(song.type, false))
								: undefined
						}
						skeletonWidth={10}
					/>
				</View>
			</View>
			{(genres === undefined || genres.length > 0) && (
				<View style={styles.row}>
					<Text
						content={`${t("models.genre_plural")}:`}
						variant="subtitle"
					/>
					<ScrollView
						horizontal
						contentContainerStyle={styles.infoScrollable}
					>
						{(genres ?? generateArray(3)).map(
							(genre: Genre | undefined, idx) => (
								<Chip
									key={idx}
									title={genre?.name}
									href={
										genre
											? `/songs?genre=${genre.id}`
											: undefined
									}
								/>
							),
						)}
					</ScrollView>
				</View>
			)}
			{(externalMetadata === undefined ||
				(externalMetadata && externalMetadata.sources.length > 0)) && (
				<View style={styles.row}>
					<Text
						content={`${t("models.externalLink_plural")}:`}
						variant="subtitle"
					/>
					<ScrollView
						horizontal
						contentContainerStyle={styles.infoScrollable}
					>
						{(externalMetadata?.sources ?? generateArray(3)).map(
							(
								source: ExternalMetadataSource | undefined,
								idx,
							) => (
								<ExternalMetadataSourceComponent
									source={source}
									key={idx}
								/>
							),
						)}
					</ScrollView>
				</View>
			)}

			{externalMetadata !== null &&
				externalMetadata?.description !== null && (
					<ExternalMetadataDescription
						description={externalMetadata?.description}
					/>
				)}
		</View>
	);
};

const TabComponent = ({
	currentTab,
	enabled,
	setCurrentTab,
}: {
	currentTab: Tab;
	enabled: boolean;
	setCurrentTab: (t: Tab) => void;
}) => {
	const { t } = useTranslation();
	const translateTabName = useCallback((t: Tab): TranslationKey => {
		switch (t) {
			case "lyrics":
				return "models.lyrics";
			case "infos":
				return "song.infoTab";
		}
	}, []);
	return (
		<View style={styles.tabs}>
			{tabs.map((tab) => (
				<Chip
					disabled={!enabled}
					key={tab}
					filled={tab === currentTab}
					title={t(translateTabName(tab))}
					onPress={() => setCurrentTab(tab)}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	content: { height: "100%", gap: theme.gap(0) },
	playButtonContent: { justifyContent: "center" },
	playButton: { paddingHorizontal: theme.gap(2) },
	tabs: {
		flexDirection: "row",
		justifyContent: "center",
		gap: theme.gap(3),
		paddingVertical: theme.gap(2),
	},
	tab: { padding: theme.gap(2) },
	lyric: { fontSize: theme.fontSize.rem(1.125) },
	info: { gap: theme.gap(2) },
	infoScrollable: { gap: theme.gap(2) },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	songTypeIcon: {
		size: theme.fontSize.rem(1.5),
	} as any,
}));
