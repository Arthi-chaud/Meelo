import { useRouter } from "next/router";
import API from "../../../api/api";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import getSlugOrId from "../../../utils/getSlugOrId";
import {
	useInfiniteQuery, useQuery, useQueryClient
} from "../../../api/use-query";
import LoadingPage from "../../../components/loading/loading-page";
import {
	Box, Button, Divider, Grid, Stack, Tab, Tabs, Typography
} from "@mui/material";
import LyricsBox from "../../../components/lyrics";
import SongRelationPageHeader from "../../../components/relation-page-header/song-relation-page-header";
import { useState } from "react";
import InfiniteSongView from "../../../components/infinite/infinite-resource-view/infinite-song-view";
import InfiniteTrackView from "../../../components/infinite/infinite-resource-view/infinite-track-view";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { playTrack } from "../../../state/playerSlice";
import ExternalIdBadge from "../../../components/external-id-badge";
import Translate from "../../../i18n/translate";
import { PlayIcon } from "../../../components/icons";

export const getServerSideProps = prepareSSR((context) => {
	const songIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { songIdentifier },
		queries: [
			API.getSong(songIdentifier, ['artist', 'externalIds']),
			API.getSongLyrics(songIdentifier),
		],
		infiniteQueries: [
			API.getSongGenres(songIdentifier),
			API.getSongVersions(songIdentifier, { sortBy: 'name', order: 'asc' }, undefined, ['artist']),
			API.getSongTracks(songIdentifier, { sortBy: 'name', order: 'asc' }, ['release', 'song'])
		]
	};
});

const tabs = ['lyrics', 'versions', 'tracks'] as const;

const SongPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	/**
	 * Parses the query to find the requested tab, fallback on tabs[0]
	 */
	const getTabFromQuery = () => tabs.find(
		(availableTab) => availableTab == router.query.tab?.toString().toLowerCase()
	) ?? tabs[0];
	const router = useRouter();
	const [tab, setTabs] = useState<typeof tabs[number]>(getTabFromQuery());
	const queryClient = useQueryClient();
	const songIdentifier = props.additionalProps?.songIdentifier ?? getSlugOrId(router.query);
	const lyrics = useQuery(API.getSongLyrics, songIdentifier);
	const song = useQuery(() => API.getSong(songIdentifier, ['artist', 'externalIds']));
	const genres = useInfiniteQuery(API.getSongGenres, songIdentifier);
	const dispatch = useDispatch();

	if (!song.data || !genres.data) {
		return <LoadingPage/>;
	}
	return <Box sx={{ width: '100%' }}>
		<SongRelationPageHeader song={song.data}/>
		<Grid container direction={{ xs: 'column', md: 'row' }} spacing={2}>
			<Grid item xs>
				{ (genres.data.pages.at(0)?.items.length ?? 0) != 0 && <Stack direction='row' sx={{ overflowY: 'scroll', alignItems: 'center' }} spacing={2}>
					<Typography sx={{ overflow: 'unset' }}><Translate translationKey="genres"/>:</Typography>
					{ genres.data.pages.at(0)?.items.map((genre) => <Link key={genre.slug} href={`/genres/${genre.slug}`}>
						<Button variant="outlined">
							{genre.name}
						</Button>
					</Link>)}
				</Stack>}
				{ song.data.externalIds.length != 0 && <Stack direction='row' sx={{ overflowY: 'scroll', alignItems: 'center', paddingTop: 2 }} spacing={2}>
					<Typography sx={{ overflow: 'unset' }}><Translate translationKey="externalLinks"/>:</Typography>
					{ song.data.externalIds.map((externalId) =>
						<ExternalIdBadge key={externalId.provider.name} externalId={externalId}/>)
					}
				</Stack>}
			</Grid>
			<Grid item>
				<Button variant="contained" sx={{ width: '100%' }} endIcon={<PlayIcon />}
					onClick={() => queryClient.fetchQuery(API.getMasterTrack(songIdentifier, ['release']))
						.then((master) => dispatch(playTrack({
							track: master,
							artist: song.data.artist,
							release: master.release
						})))
					}>
					<Translate translationKey="play"/>
				</Button>
			</Grid>
		</Grid>
		<Divider sx={{ paddingY: 1 }}/>
		<Tabs
			value={tab}
			onChange={(__, tabName) => {
				setTabs(tabName);
				router.push(`/songs/${songIdentifier}/${tabName}`, undefined, { shallow: true });
			}}
			variant="fullWidth"
		>
			{tabs.map((value, index) => (
				<Tab key={index} value={value} label={<Translate translationKey={value}/>}/>
			))}
		</Tabs>
		<Box sx={{ paddingY: 2 }}>
			{ tab == 'lyrics' && (
				lyrics.isLoading
					? <LoadingPage/>
					: <LyricsBox songName={song.data.name} lyrics={lyrics.data}/>
			)}
			{ tab == 'versions' &&
				<InfiniteSongView
					query={(sort, type) => API.getSongVersions(songIdentifier, sort, type, ['artist'])}
				/>
			}
			{ tab == 'tracks' &&
				<InfiniteTrackView
					query={(sort) => API.getSongTracks(songIdentifier, sort, ['release', 'song'])}
				/>
			}
		</Box>
	</Box>;
};

export default SongPage;
