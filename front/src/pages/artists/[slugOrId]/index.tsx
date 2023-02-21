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
import SectionHeader from "../../../components/section-header";
import VideoTile from "../../../components/tile/video-tile";
import formatDuration from "../../../utils/formatDuration";

// Number of Song item in the 'Top Song' section
const songListSize = 6;
// Number of Album item in the 'Latest albums' section
const albumListSize = 10;

const latestAlbumsQuery = (artistSlugOrId: string | number) => API.getArtistAlbums(
	artistSlugOrId,
	undefined,
	{ sortBy: 'releaseDate', order: 'desc' },
);

const videosQuery = (artistSlugOrId: string | number) => API.getArtistVideos(
	artistSlugOrId,
	undefined,
	{ sortBy: 'playCount', order: 'desc' },
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
			videosQuery(artistIdentifier),
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
	const videos = useInfiniteQuery(videosQuery, artistIdentifier);
	const topSongs = useInfiniteQuery(topSongsQuery, artistIdentifier);
	const dispatch = useDispatch();
	const queryClient = useQueryClient();

	if (!artist.data || !latestAlbums.data || !topSongs.data || !videos.data) {
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
				<SectionHeader
					heading="Top Songs"
					trailing={(topSongs.data?.pages.at(0)?.items.length ?? 0) > songListSize ?
						<Link href={`/artists/${artistIdentifier}/songs`}>
							<Button variant='contained' endIcon={<ArrowRight/>}
								sx={{ textTransform: 'none', fontWeight: 'bold' }}>See all</Button>
						</Link> : undefined
					}
				/>
				<Grid item container spacing={2}
					sx={{ display: 'flex', flexGrow: 1 }}>
					{ topSongs.data.pages.at(0)?.items.slice(0, songListSize).map((song) =>
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
			{ latestAlbums.data?.pages.at(0)?.items.length != 0 && <>
				<SectionHeader
					heading="Albums"
					trailing={(latestAlbums.data?.pages.at(0)?.items.length ?? 0) > albumListSize ?
						<Link href={`/artists/${artistIdentifier}/albums`}>
							<Button variant='contained' endIcon={<ArrowRight/>}
								sx={{ textTransform: 'none', fontWeight: 'bold' }}>
								See all
							</Button>
						</Link> : undefined
					}
				/>
				<Grid item sx={{ overflowX: 'clip', width: '100%' }}>
					<TileRow tiles={
						latestAlbums.data.pages.at(0)?.items.slice(0, albumListSize).map((album) =>
							<AlbumTile
								key={album.id}
								album={{ ...album, artist: artist.data }}
								formatSubtitle={(albumItem) => getYear(albumItem.releaseDate)?.toString() ?? ''}
							/>)
						?? []
					}/>
				</Grid>
			</>
			}
			{ videos.data.pages.at(0)?.items.length != 0 && <>
				<SectionHeader
					heading="Top Videos"
					trailing={(videos.data.pages.at(0)?.items.length ?? 0) > albumListSize ?
						<Link href={`/artists/${artistIdentifier}/videos`}>
							<Button variant='contained' endIcon={<ArrowRight/>}
								sx={{ textTransform: 'none', fontWeight: 'bold' }}>
								See all
							</Button>
						</Link> : undefined
					}
				/>
				<Grid item sx={{ overflowX: 'clip', width: '100%' }}>
					<TileRow tiles={videos.data.pages.at(0)?.items.slice(0, albumListSize)
						.map(({ video, ...song }) => <VideoTile
							key={video.id}
							video={{ ...video, song }}
							formatSubtitle={(item) => formatDuration(item.duration).toString()}
						/>) ?? []
					}/>
				</Grid>
			</>
			}
		</Grid>
	</Box>;
};

export default ArtistPage;
