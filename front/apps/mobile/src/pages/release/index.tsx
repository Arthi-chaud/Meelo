import { useSetAtom } from "jotai";
import { type ComponentProps, useMemo } from "react";
import { View } from "react-native";
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
import { type FooterSection, renderFooterSection, useFooter } from "./footer";
import { Header } from "./header";
import { releaseTracklistQuery } from "./queries";
import { DiscDivider, TrackItem, type TrackType } from "./tracklist";

type Item =
	| { type: "header"; props: ComponentProps<typeof Header> }
	| { type: "track"; props: TrackType | undefined }
	| { type: "disc"; props: { label: string; firstTrackId: number } }
	| FooterSection;

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
	const { isMixed, tracklist } = useTracklist(
		album ? tracks_ : undefined, // Do not process tracks before artist is loaded, to avoid shift in tracklist
		releaseStats,
	);
	const footerSection = useFooter({
		album,
		release,
		tracks: tracks_ ?? [],
		albumArtistId: album?.artistId,
	});
	const items: Item[] = useMemo(
		() => [
			{
				type: "header",
				props: {
					isMixed: isMixed,
					release: release,
					album: album,
					playButtonCallback: () => {
						playFromTracklist(queryForPlayer(), queryClient);
					},
					shuffleButtonCallback: () => {
						playFromTracklist(
							queryForPlayer(getRandomNumber()),
							queryClient,
						);
					},
					totalDuration: releaseStats?.totalDuration,
				},
			},
			...tracklist,
			...footerSection,
		],
		[release, album, tracklist, footerSection],
	);

	const renderItem = (item: Item) => {
		switch (item.type) {
			case "header":
				return (
					<View style={styles.header}>
						<Header {...item.props} />
					</View>
				);
			case "disc":
				return (
					<DiscDivider
						discName={item.props.label}
						discs={release?.discs ?? []}
						onPress={() => {
							playFromTracklist(
								queryForPlayer(),
								queryClient,
								undefined,
								item.props.firstTrackId,
							);
						}}
					/>
				);
			case "track": {
				const track = item.props;
				return (
					<>
						<TrackItem
							track={track}
							albumArtistId={album?.artistId}
							maxTrackIndex={releaseStats?.trackCount ?? 10}
							onPress={() => {
								if (track) {
									playFromTracklist(
										queryForPlayer(),
										queryClient,
										undefined,
										track.id,
									);
								}
							}}
						/>
						<Divider h withInsets />
					</>
				);
			}
			default:
				return renderFooterSection(item);
		}
	};

	useQueryErrorModal([releaseQuery, albumQuery, releaseStatsQuery]);
	useSetKeyIllustration(release);
	return (
		<AnimatedFlashlist
			{...scrollProps}
			contentContainerStyle={rootStyle}
			data={items}
			getItemType={({ type }) => type}
			onEndReached={fetchNextPage}
			onEndReachedThreshold={rt.screen.height / 2}
			renderItem={({ item }) => renderItem(item)}
		/>
	);
}

const useTracklist = (
	tracks: TrackType[] | undefined,
	stats: ReleaseStats | undefined,
): {
	tracklist: Item[];
	isMixed: boolean;
} => {
	const showDiscDivider = stats ? stats.discCount > 1 : false;
	return useMemo(() => {
		if (tracks === undefined) {
			return {
				tracklist: generateArray(12, undefined).map(
					(props) =>
						({
							type: "track",
							props,
						}) as const,
				),
				isMixed: false,
			};
		}
		let isMixed = true;
		const res = tracks
			?.filter((t) => t !== undefined)
			.flatMap((track, index, tracks) => {
				isMixed = isMixed && track.mixed;
				const t: Item = { type: "track", props: track };
				if (
					showDiscDivider &&
					(index === 0 ||
						tracks[index - 1].discIndex !== track.discIndex)
				) {
					const disc: Item = {
						type: "disc",
						props: {
							label: track.discIndex?.toString() ?? "?",
							firstTrackId: track.id,
						},
					};
					return [disc, t];
				}
				return [t];
			});
		return { tracklist: res, isMixed };
	}, [stats, tracks]);
};

const styles = StyleSheet.create((theme) => ({
	header: {
		paddingBottom: theme.gap(2),
	},
}));
