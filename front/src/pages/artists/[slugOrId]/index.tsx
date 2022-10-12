import { Box, Grid, Typography, Button } from "@mui/material"
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { dehydrate, QueryClient, useQuery } from "react-query";
import API from "../../../api";
import Illustration from "../../../components/illustration";
import { WideLoadingComponent } from "../../../components/loading/loading";
import { prepareMeeloQuery } from "../../../query";
import ArrowRight from '@mui/icons-material/ArrowRight';
import AlbumTile from "../../../components/tile/album-tile";
import Album from "@mui/icons-material/Album";
import Link from "next/link";
import SongItem from "../../../components/list-item/song-item";

const artistQuery = (slugOrId: string | number) => ({
	key: ['artist', slugOrId],
	exec: () => API.getArtist(slugOrId),
});

const latestAlbumsQuery = (artistSlugOrId: string | number) => ({
	key: ['artist', artistSlugOrId, 'albums', { take: 7 }],
	exec: () => API.getArtistAlbums(artistSlugOrId, { index: 0, pageSize: 7 }, { sortBy: 'releaseDate', order: 'desc' }),
});

const topSongsQuery = (artistSlugOrId: string | number) => ({
	key: ['artist', artistSlugOrId, 'songs', { take: 7 }],
	exec: () => API.getArtistSongs(artistSlugOrId, { index: 0, pageSize: 7 }, { sortBy: 'playCount', order: 'desc' }),
});


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const artistIdentifier = context.params!.slugOrId as string;
	const queryClient = new QueryClient()
  
	await Promise.all([
		queryClient.prefetchQuery(prepareMeeloQuery(artistQuery, artistIdentifier)),
		queryClient.prefetchQuery(prepareMeeloQuery(latestAlbumsQuery, artistIdentifier)),
		queryClient.prefetchQuery(prepareMeeloQuery(topSongsQuery, artistIdentifier)),
	]);
	return {
		props: {
			artistIdentifier,
			dehydratedState: dehydrate(queryClient),
		},
	}
}


const ArtistPage = ({ artistIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const router = useRouter();
	artistIdentifier ??= router.query.slugOrId as string;
	const artist = useQuery(prepareMeeloQuery(artistQuery, artistIdentifier));
	const latestAlbums = useQuery(prepareMeeloQuery(latestAlbumsQuery, artistIdentifier));
	const topSongs = useQuery(prepareMeeloQuery(topSongsQuery, artistIdentifier));
	if (!artist.data || !latestAlbums.data || !topSongs.data) {
		return <WideLoadingComponent/>
	}
	return <Box>
		<Grid container direction="column" spacing={4} sx={{ padding: 5, flex: 1, flexGrow: 1 }}>
			<Grid item container spacing={4} sx={{ justifyContent: 'flex-start' }}>
				<Grid item xs={5} sm={3} lg={2}>
					<Illustration url={artist.data!.illustration} fallback={<Album fontSize="large"/>}/> 
				</Grid>
				<Grid item sx={{ display: 'flex', alignItems: 'center' }}>
					<Typography variant='h3' fontWeight='bold'>{artist.data!.name}</Typography>
				</Grid>
			</Grid>
			{ topSongs.data?.items.length != 0 && <>
				<Grid item sx={{ display: 'flex', flexGrow: 1, justifyContent: 'space-between', alignItems: 'center'}}>
					<Typography variant='h5' fontWeight='bold'>Top Songs</Typography>
					{ topSongs.data?.metadata.next &&
					<Link href={`/artists/${artistIdentifier}/songs`}>
						<Button variant='contained' endIcon={<ArrowRight/>} color='secondary' sx={{ textTransform: 'none', fontWeight: 'bold' }}>See all</Button>
					</Link>
					}
				</Grid>
				<Grid item container spacing={2} sx={{ display: 'flex', flexGrow: 1 }}>
				{ topSongs.data
					? topSongs.data.items.slice(0, 6).map((song) => <Grid key={song.id} item xs={12} sm={6} md={4}>
						<SongItem song={{...song, artist: artist.data}}/>
					</Grid>)
					: <WideLoadingComponent/> 
				}
				</Grid>
				</>
			}
			{ latestAlbums.data?.items.length != 0 && <>
				<Grid item sx={{ display: 'flex', flexGrow: 1, justifyContent: 'space-between', alignItems: 'center'}}>
					<Typography variant='h5' fontWeight='bold'>Albums</Typography>
					{ latestAlbums.data?.metadata.next &&
					<Link href={`/artists/${artistIdentifier}/albums`}>
						<Button variant='contained' endIcon={<ArrowRight/>} color='secondary' sx={{ textTransform: 'none', fontWeight: 'bold' }}>See all</Button>
					</Link>
					}
				</Grid>
				<Grid item container spacing={2} sx={{ display: 'flex', flexGrow: 1 }}>
				{ latestAlbums.data
					? latestAlbums.data.items.slice(0, 6).map((album) => <Grid key={album.id} item xs={6} sm={4} md={2} lg={2}>
						<AlbumTile album={{...album, artist: artist.data}}/>
					</Grid>)
					: <WideLoadingComponent/> 
				}
				</Grid>
				</>
			}
		</Grid>
	</Box>
}

export default ArtistPage;