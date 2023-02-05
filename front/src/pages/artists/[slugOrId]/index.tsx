import {
	Box, Button, Grid, Typography
} from "@mui/material";
import { useRouter } from "next/router";
import API from "../../../api/api";
import Illustration from "../../../components/illustration";
import {
	useInfiniteQuery, useQuery, useQueryClient
} from "../../../api/use-query";
import ArrowRight from '@mui/icons-material/ArrowRight';
import AlbumTile from "../../../components/tile/album-tile";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { playTrack } from "../../../state/playerSlice";
import getSlugOrId from "../../../utils/getSlugOrId";
import SongContextualMenu from "../../../components/contextual-menu/song-contextual-menu";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import LoadingPage from "../../../components/loading/loading-page";
import TileRow from "../../../components/tile-row";
import ListItem from "../../../components/list-item/item";
import getYear from "../../../utils/getYear";

const latestAlbumsQuery = (artistSlugOrId: string | number) => API.getArtistAlbums(
	artistSlugOrId,
	undefined,
	{ sortBy: 'releaseDate', order: 'desc' },
);

const topSongsQuery = (artistSlugOrId: string | number) => API.getArtistSongs(
	artistSlugOrId,
	{ sortBy: 'playCount', order: 'desc' }
);

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { artistIdentifier },
		queries: [API.getArtist(artistIdentifier),],
		infiniteQueries: [
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
	const artist = useQuery(API.getArtist, artistIdentifier);
	const latestAlbums = useInfiniteQuery(latestAlbumsQuery, artistIdentifier);
	const topSongs = useInfiniteQuery(topSongsQuery, artistIdentifier);
	const dispatch = useDispatch();
	const queryClient = useQueryClient();

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
			{ topSongs.data?.pages.at(0)?.items.length != 0 && <>
				<Grid item sx={{ display: 'flex', flexGrow: 1, justifyContent: 'space-between', alignItems: 'center' }}>
					<Typography variant='h5' fontWeight='bold'>Top Songs</Typography>
					{ topSongs.data?.pages.at(0)?.end ||
					<Link href={`/artists/${artistIdentifier}/songs`}>
						<Button variant='contained' endIcon={<ArrowRight/>}
							sx={{ textTransform: 'none', fontWeight: 'bold' }}>See all</Button>
					</Link>
					}
				</Grid>
				<Grid item container spacing={2}
					sx={{ display: 'flex', flexGrow: 1 }}>
					{ topSongs.data.pages.at(0)?.items.slice(0, 6).map((song) =>
						<Grid key={song.id} item xs={12} sm={6} lg={4}>
							<ListItem
								icon={<Illustration url={song.illustration}/>}
								title={song.name}
								trailing={<SongContextualMenu
									song={{ ...song, artist: artist.data }}
								/>}
								onClick={() => queryClient
									.fetchQuery(API.getMasterTrack(song.id, ['release']))
									.then((track) => {
										dispatch(playTrack({
											artist: artist.data,
											track,
											release: track.release
										}));
									})
								}
							/>
						</Grid>)}
				</Grid>
			</>
			}
			{ latestAlbums.data.pages.at(0)?.items.length != 0 && <>
				<Grid item sx={{
					display: 'flex', flexGrow: 1,
					justifyContent: 'space-between', alignItems: 'center'
				}}>
					<Typography variant='h5' fontWeight='bold'>Albums</Typography>
					{ latestAlbums.data.pages.at(0)?.end ||
					<Link href={`/artists/${artistIdentifier}/albums`}>
						<Button variant='contained' endIcon={<ArrowRight/>}
							sx={{ textTransform: 'none', fontWeight: 'bold' }}>
							See all
						</Button>
					</Link>}
				</Grid>
				<Grid item sx={{ overflowX: 'clip', width: '100%' }}>
					<TileRow tiles={
						latestAlbums.data.pages.at(0)?.items.slice(0, 10).map((album) =>
							<AlbumTile
								key={album.id}
								album={{ ...album, artist: artist.data }}
								formatSubtitle={(albumItem) => getYear(albumItem.releaseDate)?.toString() ?? ''}
							/>)
					}/>
				</Grid>
			</>
			}
		</Grid>
	</Box>;
};

export default ArtistPage;
