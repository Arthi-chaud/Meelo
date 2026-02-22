import { useSetAtom } from "jotai";
import { useMemo } from "react";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { getAlbum, getRelease, getReleaseStats } from "@/api/queries";
import { transformPage } from "@/api/query";
import type { ReleaseStats } from "@/models/release";
import { playFromInfiniteQuery } from "@/state/player";
import { generateArray } from "@/utils/gen-list";
import { getRandomNumber } from "@/utils/random";
import { useInfiniteQuery, useQuery, useQueryClient } from "~/api";
import { AnimatedFlashlist } from "~/components/animated";
import { useSetKeyIllustration } from "~/components/background-gradient";
import type { PageScrollProps } from "~/components/fading-header";
import { useQueryErrorModal } from "~/hooks/error";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Divider } from "~/primitives/divider";
import { Footer } from "./footer";
import { Header } from "./header";
import { releaseTracklistQuery } from "./queries";
import { DiscDivider, TrackItem, type TrackType } from "./tracklist";

export default function ReleasePage({
	releaseId,
	scrollProps,
}: {
	releaseId: string;
	scrollProps: PageScrollProps;
}) {
	const rootStyle = useRootViewStyle();
	const { rt } = useUnistyles();
	const queryClient = useQueryClient();
	const playFromTracklist = useSetAtom(playFromInfiniteQuery);
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
	const query = (random?: number) => releaseTracklistQuery(releaseId, random);
	const queryForPlayer = (random?: number) =>
		transformPage(query(random), ({ song, video, ...track }) => ({
			id: track.id,
			track,
			artist: song?.artist ?? video!.artist,
			featuring: song?.featuring ?? [],
		}));
	const { items: tracks_, fetchNextPage } = useInfiniteQuery(() => query());
	const { isMixed, tracklist } = useTracklist(tracks_, releaseStats);

	useQueryErrorModal([releaseQuery, albumQuery, releaseStatsQuery]);
	useSetKeyIllustration(release);
	return (
		<AnimatedFlashlist
			{...scrollProps}
			contentContainerStyle={rootStyle}
			data={tracklist}
			ListHeaderComponent={() => (
				<Header
					isMixed={isMixed}
					release={release}
					album={album}
					playButtonCallback={() => {
						playFromTracklist(queryForPlayer(), queryClient);
					}}
					shuffleButtonCallback={() => {
						playFromTracklist(
							queryForPlayer(getRandomNumber()),
							queryClient,
						);
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
			renderItem={({ item, index }) => {
				if (typeof item === "string") {
					const discName = item;
					return (
						<DiscDivider
							discName={discName}
							discs={release?.discs ?? []}
							onPress={() => {
								playFromTracklist(
									queryForPlayer(),
									queryClient,
									undefined,
									(tracklist.at(index + 1) as TrackType).id,
								);
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
								playFromTracklist(
									queryForPlayer(),
									queryClient,
									undefined,
									track.id,
								);
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
): {
	tracklist: (string | TrackType | undefined)[];
	isMixed: boolean;
} => {
	const showDiscDivider = stats ? stats.discCount > 1 : false;
	return useMemo(() => {
		if (tracks === undefined) {
			return { tracklist: generateArray(12, undefined), isMixed: false };
		}
		let isMixed = true;
		const res = tracks
			?.filter((t) => t !== undefined)
			.flatMap((track, index, tracks) => {
				isMixed = isMixed && track.mixed;
				if (
					showDiscDivider &&
					(index === 0 ||
						tracks[index - 1].discIndex !== track.discIndex)
				) {
					return [track.discIndex?.toString() ?? "?", track];
				}
				return [track];
			});
		return { tracklist: res, isMixed };
	}, [stats, tracks]);
};

const styles = StyleSheet.create((theme) => ({
	header: {
		paddingBottom: theme.gap(2),
	},
	footer: {
		paddingTop: theme.gap(2),
	},
}));
