import {
	Button, Container, Divider, Fade, Grid, IconButton,
	ListSubheader, Typography, useTheme
} from "@mui/material";
import { Box } from "@mui/system";
import { useRouter } from "next/router";
import API from "../../api/api";
import Illustration from "../../components/illustration";
import formatDuration from '../../utils/formatDuration';
import { useEffect, useState } from "react";
import Tracklist from "../../models/tracklist";
import Link from 'next/link';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { Shuffle } from "@mui/icons-material";
import Tile from "../../components/tile/tile";
import {
	useInfiniteQuery, useQueries, useQuery
} from "../../api/use-query";
import { useDispatch } from "react-redux";
import { playTrack, playTracks } from "../../state/playerSlice";
import Song from "../../models/song";
import Artist from "../../models/artist";
import { shuffle } from 'd3-array';
import getSlugOrId from "../../utils/getSlugOrId";
import ReleaseTrackList from "../../components/release-tracklist";
import prepareSSR, { InferSSRProps } from "../../ssr";
import ReleaseContextualMenu from "../../components/contextual-menu/release-contextual-menu";
import LoadingPage from "../../components/loading/loading-page";
import TileRow from "../../components/tile-row";
import { TrackWithRelations } from "../../models/track";
import getYear from "../../utils/getYear";

export const getServerSideProps = prepareSSR((context) => {
	const releaseIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { releaseIdentifier },
		queries: [API.getRelease(releaseIdentifier), API.getReleaseTrackList(releaseIdentifier)]
	};
});

type RelatedContentSectionProps = {
	display: boolean,
	title: string,
	children: JSX.Element;
}

const RelatedContentSection = (props: RelatedContentSectionProps) => {
	return (
		<Fade in={props.display == true}>
			<Box sx={{ margin: 3, display: props.display ? undefined : 'none' }}>
				<Divider/>
				<Typography variant='h6' sx={{ paddingY: 3 }}>{props.title}</Typography>
				{props.children}
			</Box>
		</Fade>
	);
};

const getSongArtist = (song: Song, albumArtist?: Artist, otherArtists: Artist[] = []): Artist => {
	if (song.artistId == albumArtist?.id) {
		return albumArtist;
	}
	return otherArtists.find((otherArtist) => otherArtist.id == song.artistId)!;
};

const ReleasePage = (
	{ releaseIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	releaseIdentifier ??= getSlugOrId(router.query);
	const theme = useTheme();
	const dispatch = useDispatch();
	const [trackList, setTracklist] = useState<Tracklist<TrackWithRelations<['song']>>>();
	const [totalDuration, setTotalDuration] = useState<number | null>(null);
	const [tracks, setTracks] = useState<TrackWithRelations<['song']>[]>([]);

	const release = useQuery((id) => API.getRelease(id, ['album']), releaseIdentifier);
	const artistId = release.data?.album?.artistId;

	const tracklist = useQuery((id) => API.getReleaseTrackList(id, ['song']), releaseIdentifier);
	const albumArtist = useQuery(API.getArtist, artistId);
	const albumGenres = useInfiniteQuery(API.getAlbumGenres, release.data?.albumId);
	const hasGenres = (albumGenres.data?.pages.at(0)?.items.length ?? 0) > 0;
	const otherArtistsQuery = useQueries(...tracks
		.filter((track: TrackWithRelations<['song']>) => track.song.artistId != albumArtist.data?.id)
		.map((track): Parameters<typeof useQuery<Artist, Parameters<typeof API.getArtist>>> =>
			[API.getArtist, track.song.artistId]));
	const albumVideos = useQuery((id) => API.getAlbumVideos(id, ['song']), release.data?.albumId);
	const relatedReleases = useInfiniteQuery(API.getAlbumReleases, release.data?.albumId);

	useEffect(() => {
		if (tracklist.data) {
			const discMap = tracklist.data;
			const flatTracks = Array.from(Object.values(discMap)).flat();

			setTracks(flatTracks);
			setTotalDuration(
				flatTracks.reduce((prevDuration, track) => prevDuration + track.duration, 0)
			);
			setTracklist(discMap);
		}
	}, [tracklist.data]);
	// eslint-disable-next-line no-extra-parens
	if (!release.data || (artistId && !albumArtist.data) || !trackList) {
		return <LoadingPage/>;
	}
	return (
		<Container maxWidth={false} sx={{ marginY: 3 }} >
			<Grid container spacing={4} sx={{ justifyContent: 'center' }}>
				<Grid item md={3} sm={5} xs={8}>
					<Illustration url={release.data!.illustration}/>
				</Grid>
				<Grid item container
					sx={{
						width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly',
						alignItems: 'left', [theme.breakpoints.down('sm')]: { alignItems: 'center', textAlign: 'center' }
					}}
					md={6} sm={7} xs={12}
				>
					<Grid item sx={{ width: 'inherit' }}>
						<Typography variant='h3' fontWeight='bold'>{release.data!.name}</Typography>
					</Grid>
					{albumArtist.data &&
						<Grid item>
							<Link href={`/artists/${albumArtist.data.slug}`}>
								<Button variant='text' sx={{ textTransform: 'none', position: 'relative', left: { xs: 0, sm: -8 } }}>
									<Typography variant='h4'>{albumArtist.data.name}</Typography>
								</Button>
							</Link>
						</Grid>
					}
					<Grid item>
						<Typography sx={{ color: 'text.disabled' }}>
							{(release.data.releaseDate || release.data.album.releaseDate) &&
								`${new Date(release.data.releaseDate ?? release.data.album.releaseDate!).getFullYear()} - `}
							{formatDuration(totalDuration ?? undefined)}
						</Typography>
					</Grid>
				</Grid>
				<Grid item container md={3}
					xs={12} sx={{ spacing: 5, alignItems: 'center', justifyContent: 'space-evenly', display: 'flex' }}>
					{[() => <PlayCircleIcon fontSize="large"/>, () => <Shuffle fontSize="large"/>].map((icon, index) =>
						<Grid item key={index}>
							<IconButton onClick={() => {
								if (tracks && !otherArtistsQuery.find((query) => !query.data)) {
									const otherArtists = otherArtistsQuery
										.map((query) => query.data!);
									let playlist = tracks.map((track) => ({
										track: track,
										artist: getSongArtist(
											track.song, albumArtist.data, otherArtists
										),
										release: release.data
									}));

									if (index == 1) {
										playlist = shuffle(playlist);
									}
									dispatch(playTracks({ tracks: playlist }));
								}
							}}>
								{icon()}
							</IconButton>
						</Grid>)
					}
					<Grid item>
						<ReleaseContextualMenu
							release={{ ...release.data, album: release.data.album }}
						/>
					</Grid>
				</Grid>
			</Grid>
			<Grid container spacing={1} sx={{ display: 'flex', paddingY: 2 }}>
				{ hasGenres &&
					<Grid item md={3} xs={12}>
						<Fade in={albumGenres.data != undefined}>
							<Box>
								<Grid container spacing={1} sx={{ alignItems: 'center' }}>
									<Grid item>
										<ListSubheader>Genres:</ListSubheader>
									</Grid>
									{ albumGenres.data?.pages.at(0)?.items.map((genre) =>
										<Grid item key={genre.id} sx={{ display: 'flex' }}>
											<Link href={`/genres/${genre.slug}`}>
												<Button variant="outlined" color='inherit'>
													{ genre.name }
												</Button>
											</Link>
										</Grid>) ?? []}
								</Grid>
								<Divider sx={{
									paddingY: 1,
									display: "none",
									[theme.breakpoints.down('md')]: {
										display: 'block'
									}
								}} />
							</Box>
						</Fade>
					</Grid>
				}
				<Grid item md={hasGenres ? 9 : true} xs={12}>
					{ albumGenres.data && trackList &&
						otherArtistsQuery.findIndex((query) => query.data == undefined) == -1 &&
						<Fade in><Box>
							<ReleaseTrackList
								mainArtist={albumArtist.data}
								tracklist={Object.fromEntries(Array.from(Object.entries(trackList))
									.map(([discKey, discTracks]) => [
										discKey,
										discTracks.map((discTrack) => ({
											...discTrack,
											song: {
												...discTrack.song,
												// eslint-disable-next-line max-len
												artist: discTrack.song.artistId == albumArtist.data?.id
													? albumArtist.data!
													: otherArtistsQuery.find(
														// eslint-disable-next-line max-len
														(otherArtist) => otherArtist.data?.id == discTrack.song.artistId
													)!.data!
											}
										}))
									]))
								}
								release={release.data}
							/>
						</Box></Fade>
					}
				</Grid>
			</Grid>
			<RelatedContentSection
				display={(relatedReleases.data?.pages.at(0)?.items?.length ?? 0) > 1}
				title={"Other releases of the same album"}
			>
				<TileRow tiles={
					relatedReleases.data?.pages.at(0)?.items?.filter(
						(relatedRelease) => relatedRelease.id != release.data!.id
					).map((otherRelease, otherReleaseIndex) =>
						<Tile key={otherReleaseIndex}
							href={`/releases/${albumArtist?.data?.slug ?? 'compilations'}+${release.data!.album.slug}+${otherRelease.slug}/`}
							title={otherRelease.name}
							subtitle={getYear(otherRelease.releaseDate)?.toString()}
							illustration={<Illustration url={otherRelease.illustration}/>}
						/>) ?? []
				}/>
			</RelatedContentSection>
			<RelatedContentSection
				display={albumVideos.data !== undefined && albumVideos.data.length != 0}
				title={"Music Videos"}
			>
				<TileRow tiles={albumVideos.data?.map((video, videoIndex) =>
					<Tile key={videoIndex}
						onClick={() => {
							const parentArtist = getSongArtist(
								video.song,
								albumArtist.data,
								otherArtistsQuery
									.filter((query) => !query.data)
									.map((query) => query.data!)
							);

							dispatch(playTrack({
								track: video,
								release: release.data,
								artist: parentArtist
							}));
						}}
						title={video.name}
						subtitle={formatDuration(video.duration)}
						illustration={
							<Illustration aspectRatio={16/9} url={video.illustration} style={{ objectFit: 'cover' }}/>
						}/>) ?? []}
				/>
			</RelatedContentSection>
		</Container>
	);
};

export default ReleasePage;
