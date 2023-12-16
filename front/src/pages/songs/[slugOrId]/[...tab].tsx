import { useRouter } from "next/router";
import API from "../../../api/api";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import getSlugOrId from "../../../utils/getSlugOrId";
import {
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from "../../../api/use-query";
import LoadingPage from "../../../components/loading/loading-page";
import {
	Box,
	Button,
	Divider,
	Stack,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import LyricsBox from "../../../components/lyrics";
import SongRelationPageHeader from "../../../components/relation-page-header/song-relation-page-header";
import { useState } from "react";
import InfiniteSongView from "../../../components/infinite/infinite-resource-view/infinite-song-view";
import InfiniteTrackView from "../../../components/infinite/infinite-resource-view/infinite-track-view";
import { useDispatch } from "react-redux";
import { playTrack } from "../../../state/playerSlice";
import ExternalIdBadge from "../../../components/external-id-badge";
import Translate from "../../../i18n/translate";
import { PlayIcon } from "../../../components/icons";
import BackgroundBlurhash from "../../../components/blurhash-background";
import GenreButton from "../../../components/genre-button";

export const getServerSideProps = prepareSSR((context) => {
	const songIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { songIdentifier },
		queries: [
			API.getSong(songIdentifier, ["artist", "externalIds", "featuring"]),
			API.getSongLyrics(songIdentifier),
		],
		infiniteQueries: [
			API.getGenres({ song: songIdentifier }),
			API.getSongVersions(
				songIdentifier,
				{},
				{ sortBy: "name", order: "asc" },
				["artist", "featuring"],
			),
			API.getTracks(
				{ song: songIdentifier },
				{ sortBy: "name", order: "asc" },
				["release", "song"],
			),
		],
	};
});

const tabs = ["lyrics", "versions", "tracks", "more"] as const;

const SongPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	/**
	 * Parses the query to find the requested tab, fallback on tabs[0]
	 */
	const getTabFromQuery = () =>
		tabs.find(
			(availableTab) =>
				availableTab == router.query.tab?.toString().toLowerCase(),
		) ?? tabs[0];
	const router = useRouter();
	const [tab, setTabs] = useState<(typeof tabs)[number]>(getTabFromQuery());
	const queryClient = useQueryClient();
	const songIdentifier =
		props.additionalProps?.songIdentifier ?? getSlugOrId(router.query);
	const lyrics = useQuery(API.getSongLyrics, songIdentifier);
	const song = useQuery(() =>
		API.getSong(songIdentifier, ["artist", "externalIds", "featuring"]),
	);
	const genres = useInfiniteQuery(API.getGenres, { song: songIdentifier });
	const dispatch = useDispatch();

	if (!song.data || !genres.data) {
		return <LoadingPage />;
	}
	return (
		<Box sx={{ width: "100%" }}>
			<BackgroundBlurhash blurhash={song.data.illustration?.blurhash} />
			<SongRelationPageHeader song={song.data} />
			<Button
				variant="contained"
				sx={{ width: "100%", marginTop: 1 }}
				endIcon={<PlayIcon />}
				onClick={() =>
					queryClient
						.fetchQuery(
							API.getMasterTrack(songIdentifier, ["release"]),
						)
						.then((master) =>
							dispatch(
								playTrack({
									track: master,
									artist: song.data.artist,
									release: master.release,
								}),
							),
						)
				}
			>
				<Translate translationKey="play" />
			</Button>
			<Divider sx={{ paddingY: 1 }} />
			<Tabs
				value={tab}
				onChange={(__, tabName) => {
					setTabs(tabName);
					router.push(
						`/songs/${songIdentifier}/${tabName}`,
						undefined,
						{
							shallow: true,
						},
					);
				}}
				variant="scrollable"
			>
				{tabs.map((value, index) => (
					<Tab
						key={index}
						value={value}
						sx={{ minWidth: "fit-content", flex: 1 }}
						label={<Translate translationKey={value} />}
					/>
				))}
			</Tabs>
			<Box sx={{ paddingY: 2 }}>
				{tab == "more" && (
					<>
						{(genres.data.pages.at(0)?.items.length ?? 0) != 0 && (
							<Stack
								direction="row"
								sx={{
									overflowX: "scroll",
									alignItems: "center",
								}}
								spacing={2}
							>
								<Typography sx={{ overflow: "unset" }}>
									<Translate translationKey="genres" />:
								</Typography>
								{genres.data.pages
									.at(0)
									?.items.map((genre) => (
										<GenreButton
											key={genre.slug}
											genre={genre}
										/>
									))}
							</Stack>
						)}
						{song.data.externalIds.length != 0 && (
							<Stack
								direction="row"
								sx={{
									overflowX: "scroll",
									alignItems: "center",
									paddingTop: 2,
								}}
								spacing={2}
							>
								<Typography sx={{ overflow: "unset" }}>
									<Translate translationKey="externalLinks" />
									:
								</Typography>
								{song.data.externalIds
									.filter(({ url }) => url !== null)
									.map((externalId) => (
										<ExternalIdBadge
											key={externalId.provider.name}
											externalId={externalId}
										/>
									))}
							</Stack>
						)}
						<Typography variant="body1" sx={{ paddingTop: 2 }}>
							{song.data.externalIds
								.map(({ description }) => description)
								.filter((desc) => desc !== null)
								.at(0)}
						</Typography>
					</>
				)}
				{tab == "lyrics" &&
					(lyrics.isLoading ?
						<LoadingPage />
					:	<LyricsBox
							songName={song.data.name}
							lyrics={lyrics.data}
						/>)}
				{tab == "versions" && (
					<InfiniteSongView
						query={({ library, sortBy, order, type }) =>
							API.getSongVersions(
								song.data.id,
								{ library: library ?? undefined, type },
								{ sortBy, order },
								["artist", "featuring"],
							)
						}
					/>
				)}
				{tab == "tracks" && (
					<InfiniteTrackView
						query={(sort) =>
							API.getTracks({ song: songIdentifier }, sort, [
								"release",
								"song",
							])
						}
					/>
				)}
			</Box>
		</Box>
	);
};

export default SongPage;
