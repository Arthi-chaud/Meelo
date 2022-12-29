import {
	Box, Button, Grid, Typography
} from "@mui/material";
import { useRouter } from "next/router";
import API from "../../../api/api";
import Illustration from "../../../components/illustration";
import { useQuery } from "../../../api/use-query";
import ArrowRight from '@mui/icons-material/ArrowRight';
import AlbumTile from "../../../components/tile/album-tile";
import Link from "next/link";
import { SongWithArtist } from "../../../models/song";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import { useDispatch } from "react-redux";
import { playTrack } from "../../../state/playerSlice";
import { TrackWithRelease } from "../../../models/track";
import getSlugOrId from "../../../utils/getSlugOrId";
import SongContextualMenu from "../../../components/contextual-menu/song-contextual-menu";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import LoadingPage from "../../../components/loading/loading-page";
import TileRow from "../../../components/tile-row";

type SongButtonProps = {
	song: SongWithArtist;
}
const SongButton = (props: SongButtonProps) => {
	const dispatch = useDispatch();

	return <Grid container sx={{ alignItems: 'center' }}>
		<Grid item xs={10}>
			<Button
				sx={{ textTransform: 'none', alignItems: 'center', width: '100%' }}
				onClick={() => {
					API.getMasterTrack<TrackWithRelease>(props.song.id, ['release']).then((track) => {
						dispatch(playTrack({
							artist: props.song.artist,
							track,
							release: track.release
						}));
					});
				}}
			>
				<Grid container spacing={1.5} direction={'row'}
					sx={{ alignItems: 'center' }}>
					<Grid item xs={2.5} sm={3}
						md={2}>
						<Illustration url={props.song.illustration} fallback={<AudiotrackIcon/>}/>
					</Grid>
					<Grid item xs sx={{
						display: 'flex', justifyContent: 'flex-start', overflow: 'hidden',
						textOverflow: 'ellipsis', whiteSpace: 'nowrap'
					}}>
						<Typography textAlign='left' fontWeight='bold'>
							{props.song.name}
						</Typography>
					</Grid>
				</Grid>
			</Button>
		</Grid>
		<Grid item xs='auto'>
			<SongContextualMenu song={props.song} />
		</Grid>
	</Grid>;
};

const artistQuery = (slugOrId: string | number) => ({
	key: ['artist', slugOrId],
	exec: () => API.getArtist(slugOrId),
});

const latestAlbumsQuery = (artistSlugOrId: string | number) => ({
	key: [
		'artist',
		artistSlugOrId,
		'albums',
		{ take: 7 }
	],
	exec: () => API.getArtistAlbums(
		artistSlugOrId,
		{ index: 0, pageSize: 7 },
		undefined,
		{ sortBy: 'releaseDate', order: 'desc' }
	),
});

const topSongsQuery = (artistSlugOrId: string | number) => ({
	key: [
		'artist',
		artistSlugOrId,
		'songs',
		{ take: 7 }
	],
	exec: () => API.getArtistSongs(
		artistSlugOrId,
		{ index: 0, pageSize: 11 },
		{ sortBy: 'playCount', order: 'desc' }
	),
});

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { artistIdentifier },
		queries: [
			artistQuery(artistIdentifier),
			latestAlbumsQuery(artistIdentifier),
			topSongsQuery(artistIdentifier)
		]
	};
});

const ArtistPage = (
	{ artistIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	artistIdentifier ??= getSlugOrId(router.query);
	const artist = useQuery(artistQuery, artistIdentifier);
	const latestAlbums = useQuery(latestAlbumsQuery, artistIdentifier);
	const topSongs = useQuery(topSongsQuery, artistIdentifier);

	if (!artist.data || !latestAlbums.data || !topSongs.data) {
		return <LoadingPage/>;
	}
	return <Box>
		<Grid container direction="column" spacing={4}
			sx={{ padding: 2, flex: 1, flexGrow: 1 }}>
			<Grid item container spacing={4}
				sx={{ justifyContent: 'flex-start' }}>
				<Grid item xs={5} sm={3}
					lg={2}>
					<Illustration url={artist.data!.illustration} style={{ objectFit: "cover" }} />
				</Grid>
				<Grid item xs sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
					<Typography variant='h3' fontWeight='bold'>{artist.data!.name}</Typography>
				</Grid>
			</Grid>
			{ topSongs.data?.items.length != 0 && <>
				<Grid item sx={{ display: 'flex', flexGrow: 1, justifyContent: 'space-between', alignItems: 'center' }}>
					<Typography variant='h5' fontWeight='bold'>Top Songs</Typography>
					{ topSongs.data?.metadata.next &&
					<Link href={`/artists/${artistIdentifier}/songs`}>
						<Button variant='contained' endIcon={<ArrowRight/>}
							sx={{ textTransform: 'none', fontWeight: 'bold' }}>See all</Button>
					</Link>
					}
				</Grid>
				<Grid item container spacing={2}
					sx={{ display: 'flex', flexGrow: 1 }}>
					{ topSongs.data.items.slice(0, 6).map((song) =>
						<Grid key={song.id} item xs={12} sm={6} lg={4}>
							<SongButton song={{ ...song, artist: artist.data }}/>
						</Grid>)}
				</Grid>
			</>
			}
			{ latestAlbums.data.items.length != 0 && <>
				<Grid item sx={{
					display: 'flex', flexGrow: 1,
					justifyContent: 'space-between', alignItems: 'center'
				}}>
					<Typography variant='h5' fontWeight='bold'>Albums</Typography>
					{ latestAlbums.data.metadata.next &&
					<Link href={`/artists/${artistIdentifier}/albums`}>
						<Button variant='contained' endIcon={<ArrowRight/>}
							sx={{ textTransform: 'none', fontWeight: 'bold' }}>
							See all
						</Button>
					</Link>}
				</Grid>
				<Grid item>
					<TileRow tiles={
						latestAlbums.data.items.slice(0, 10).map((album) =>
							<AlbumTile key={album.id} album={{ ...album, artist: artist.data }}/>)
					}/>
				</Grid>
			</>
			}
		</Grid>
	</Box>;
};

export default ArtistPage;
