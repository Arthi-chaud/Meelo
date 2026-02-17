import { FlashList } from "@shopify/flash-list";
import { useMemo } from "react";
import Animated from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
	getAlbum,
	getRelease,
	getReleaseStats,
	getReleaseTracklist,
} from "@/api/queries";
import type { ReleaseStats } from "@/models/release";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery, useQuery } from "~/api";
import { useSetKeyIllustration } from "~/components/background-gradient";
import { useQueryErrorModal } from "~/hooks/error";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Divider } from "~/primitives/divider";
import { Footer } from "./footer";
import { Header } from "./header";
import { DiscDivider, TrackItem, type TrackType } from "./tracklist";

export default function ReleasePage({
	releaseId,
	scrollHandler,
}: {
	releaseId: string;
	scrollHandler?: any;
}) {
	const rootStyle = useRootViewStyle();
	const { rt } = useUnistyles();
	const releaseQuery = useQuery(() =>
		getRelease(releaseId, ["illustration", "discs", "label"]),
	);
	const { data: release } = releaseQuery;
	const albumQuery = useQuery(
		(albumId) => getAlbum(albumId, ["artist"]),
		release?.albumId,
	);
	const { data: album } = albumQuery;
	const releaseStatsQuery = useQuery(() => getReleaseStats(releaseId));
	const { data: releaseStats } = releaseStatsQuery;
	const { items: tracks_, fetchNextPage } = useInfiniteQuery(() =>
		getReleaseTracklist(releaseId, false, [
			"artist",
			"featuring",
			"illustration",
		]),
	);
	const { isMixed, tracklist } = useTracklist(tracks_, releaseStats);

	useQueryErrorModal([releaseQuery, albumQuery, releaseStatsQuery]);
	useSetKeyIllustration(release);
	return (
		<AFlashList
			onScroll={scrollHandler}
			scrollEventThrottle={16}
			contentContainerStyle={rootStyle}
			data={tracklist}
			ListHeaderComponent={() => (
				<Header
					isMixed={isMixed}
					release={release}
					album={album}
					playButtonCallback={() => {
						//TODO
					}}
					shuffleButtonCallback={() => {
						//TODO
					}}
					totalDuration={releaseStats?.totalDuration}
				/>
			)}
			ListHeaderComponentStyle={styles.header}
			ListFooterComponent={() => (
				<Footer
					tracks={tracks_ ?? []}
					release={release}
					album={album}
					albumArtistId={album?.artistId}
				/>
			)}
			ListFooterComponentStyle={styles.footer}
			onEndReached={fetchNextPage}
			onEndReachedThreshold={rt.screen.height / 2}
			renderItem={({ item }) => {
				if (typeof item === "string") {
					const discName = item;
					return (
						<DiscDivider
							discName={discName}
							discs={release?.discs ?? []}
							onPress={() => {
								// TODO
							}}
						/>
					);
				}
				const track = item as TrackType;
				return (
					<>
						<TrackItem
							track={track}
							albumArtistId={album?.artistId}
							maxTrackIndex={releaseStats?.trackCount ?? 10}
							onPress={() => {
								// TODO
							}}
						/>

						{/* TODO I dont like that the divier isn't centered with the track name */}
						<Divider h withInsets />
					</>
				);
			}}
		/>
	);
}

const useTracklist = (
	tracks: TrackType[] | undefined,
	stats: ReleaseStats | undefined,
): { tracklist: (string | TrackType | undefined)[]; isMixed: boolean } => {
	const showDiscDivider = stats ? stats.discCount > 1 : false;
	return useMemo(() => {
		if (tracks === undefined) {
			return { tracklist: generateArray(12, undefined), isMixed: false };
		}
		let isMixed = true;
		const res = tracks
			?.filter((t) => t !== undefined)
			.flatMap((track, index, tracks) => {
				const t: TrackType = {
					...track,
					song: track.song,
					video: track.video,
				};
				isMixed = isMixed && track.mixed;
				if (
					showDiscDivider &&
					(index === 0 ||
						tracks[index - 1].discIndex !== track.discIndex)
				) {
					return [track.discIndex?.toString() ?? "?", t];
				}
				return [t];
			});
		return { tracklist: res, isMixed };
	}, [stats, tracks]);
};
const AFlashList = Animated.createAnimatedComponent(FlashList);

const styles = StyleSheet.create((theme) => ({
	header: {
		paddingBottom: theme.gap(2),
	},
	footer: {
		paddingTop: theme.gap(2),
	},
}));
