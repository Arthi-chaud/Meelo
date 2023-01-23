import { useRouter } from "next/router";
import API from "../../api/api";
import { SongSortingKeys, SongWithArtist } from "../../models/song";
import prepareSSR, { InferSSRProps } from "../../ssr";
import getSlugOrId from "../../utils/getSlugOrId";
import { useQuery } from "../../api/use-query";
import LoadingPage from "../../components/loading/loading-page";
import {
	Box, Button, Divider, Grid, Stack, Tab, Tabs, Typography
} from "@mui/material";
import LyricsBox from "../../components/lyrics";
import SongRelationPageHeader from "../../components/relation-page-header/song-relation-page-header";
import { useEffect, useState } from "react";
import InfiniteSongView from "../../components/infinite/infinite-resource-view/infinite-song-view";
import { Page } from "../../components/infinite/infinite-scroll";
import Track, {
	TrackSortingKeys,
	TrackWithRelease,
	TrackWithSong
} from "../../models/track";
import { SortingParameters } from "../../utils/sorting";
import InfiniteTrackView from "../../components/infinite/infinite-resource-view/infinite-track-view";
import Link from "next/link";
import { PlayArrow } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { playTrack } from "../../state/playerSlice";

const songQuery = (songSlugOrId: number | string) => ({
	key: ["song", songSlugOrId],
	exec: () => API.getSong<SongWithArtist>(songSlugOrId, ["artist"])
});

const lyricsQuery = (songSlugOrId: number | string) => ({
	key: [
		"song",
		songSlugOrId,
		"lyrics"
	],
	exec: () => API.getSongLyrics(songSlugOrId)
});

const songVersionsQuery = (
	songSlugOrId: number | string, sort?: SortingParameters<typeof SongSortingKeys>
) => ({
	key: [
		"song",
		songSlugOrId,
		"versions",
		sort ?? {}
	],
	exec: (lastPage: Page<SongWithArtist>) =>
		API.getSongVersions<SongWithArtist>(songSlugOrId, lastPage, sort, ['artist'])
});

const songGenresQuery = (songSlugOrId: number | string) => ({
	key: [
		"song",
		songSlugOrId,
		"genres"
	],
	exec: () =>	API.getSongGenres(songSlugOrId)
});

const songTracksQuery = (
	songSlugOrId: number | string, sort?: SortingParameters<typeof TrackSortingKeys>
) => ({
	key: [
		"song",
		songSlugOrId,
		"tracks",
		sort ?? {}
	],
	exec: (lastPage: Page<Track>) =>
		API.getSongTracks<TrackWithRelease & TrackWithSong>(songSlugOrId, lastPage, sort, ["release", "song"])
});

export const getServerSideProps = prepareSSR((context) => {
	const songIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { songIdentifier },
		queries: [songQuery(songIdentifier), lyricsQuery(songIdentifier)]
	};
});

const tabs = ['lyrics', 'versions', 'tracks'] as const;

const SongPage = (
	{ songIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();
	const [tab, setTabs] = useState<typeof tabs[number]>(tabs[0]);

	songIdentifier ??= getSlugOrId(router.query);
	const lyrics = useQuery(lyricsQuery, songIdentifier);
	const song = useQuery(songQuery, songIdentifier);
	const genres = useQuery(songGenresQuery, songIdentifier);
	const dispatch = useDispatch();

	useEffect(() => {
		setTabs(() => tabs.find(
			(availableTab) => availableTab == router.query.tab?.toString().toLowerCase()
		) ?? tabs[0]);
	}, [router]);

	useEffect(() => {
		const path = router.asPath.split('?')[0];
		const params = new URLSearchParams(router.asPath.split('?').at(1) ?? '');

		params.set('tab', tab);
		router.push(`${path}?${params.toString()}`, undefined, { shallow: true });
	}, [tab]);

	if (!song.data || !genres.data) {
		return <LoadingPage/>;
	}
	return <Box sx={{ width: '100%' }}>
		<SongRelationPageHeader song={song.data}/>
		<Grid container direction={{ xs: 'column', md: 'row' }} spacing={2}>
			<Grid item xs>
				<Stack direction='row' sx={{ overflowY: 'scroll', alignItems: 'center' }} spacing={2}>
					<Typography sx={{ overflow: 'unset' }}>Genres:</Typography>
					{ genres.data.items.map((genre) => <Link key={genre.slug} href={`/genres/${genre.slug}`}>
						<Button variant="outlined">
							{genre.name}
						</Button>
					</Link>)}
				</Stack>
			</Grid>
			<Grid item>
				<Button variant="contained" sx={{ width: '100%' }} endIcon={<PlayArrow />}
					onClick={() => API.getMasterTrack<TrackWithRelease>(songIdentifier, ['release'])
						.then((master) => dispatch(playTrack({
							track: master,
							artist: song.data.artist,
							release: master.release
						})))
					}>Play</Button>
			</Grid>
		</Grid>
		<Divider sx={{ paddingY: 1 }}/>
		<Tabs
			value={tab}
			onChange={(__, tabName) => setTabs(tabName)}
			variant="fullWidth"
		>
			<Tab key={0} value={'lyrics'} label={'Lyrics'}/>
			<Tab key={1} value={'versions'} label={'Versions'}/>
			<Tab key={2} value={'tracks'} label={'Tracks'}/>
		</Tabs>
		<Box sx={{ paddingY: 2 }}>
			{ tab == 'lyrics' && (
				lyrics.isLoading
					? <LoadingPage/>
					: <LyricsBox songName={song.data.name} lyrics={lyrics.data}/>
			)}
			{ tab == 'versions' &&
				<InfiniteSongView
					query={(sort) => songVersionsQuery(songIdentifier, sort)}
				/>
			}
			{ tab == 'tracks' &&
				<InfiniteTrackView
					query={(sort) => songTracksQuery(songIdentifier, sort)}
				/>
			}
		</Box>
	</Box>;
};

export default SongPage;
