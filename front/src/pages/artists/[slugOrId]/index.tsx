import {
	Box, Button, Divider, Grid, Typography
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
import getSlugOrId from "../../../utils/getSlugOrId";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import LoadingPage from "../../../components/loading/loading-page";
import TileRow from "../../../components/tile-row";
import getYear from "../../../utils/getYear";
import SectionHeader from "../../../components/section-header";
import VideoTile from "../../../components/tile/video-tile";
import formatDuration from "../../../utils/formatDuration";
import ExternalIdBadge from "../../../components/external-id-badge";
import SongGrid from "../../../components/song-grid";
import Translate from "../../../i18n/translate";

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

const artistQuery = (artistSlugOrId: string | number) => API.getArtist(
	artistSlugOrId,
	['externalIds']
);

const appearanceQuery = (artistSlugOrId: string | number) => API.getAlbumsWithAppearingArtist(
	artistSlugOrId, undefined, { sortBy: 'releaseDate', order: 'desc' }, ['artist']
);

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { artistIdentifier },
		queries: [artistQuery(artistIdentifier)],
		infiniteQueries: [
			latestAlbumsQuery(artistIdentifier),
			videosQuery(artistIdentifier),
			topSongsQuery(artistIdentifier),
			appearanceQuery(artistIdentifier)
		]
	};
});

const ArtistPage = (
	{ artistIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	artistIdentifier ??= getSlugOrId(router.query);
	const artist = useQuery(artistQuery, artistIdentifier);
	const latestAlbums = useInfiniteQuery(latestAlbumsQuery, artistIdentifier);
	const videos = useInfiniteQuery(videosQuery, artistIdentifier);
	const topSongs = useInfiniteQuery(topSongsQuery, artistIdentifier);
	const appearances = useInfiniteQuery(appearanceQuery, artistIdentifier);
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
					<Illustration illustration={artist.data?.illustration} style={{ objectFit: "cover" }} />
				</Grid>
				<Grid item xs sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
					<Typography variant='h3' fontWeight='bold'>{artist.data!.name}</Typography>
				</Grid>
			</Grid>
			{ topSongs.data?.pages.at(0)?.items.length != 0 && <>
				<SectionHeader
					heading={<Translate translationKey="topSongs"/>}
					trailing={(topSongs.data?.pages.at(0)?.items.length ?? 0) > songListSize ?
						<Link href={`/artists/${artistIdentifier}/songs`}>
							<Button variant='contained' color='secondary' endIcon={<ArrowRight/>}
								sx={{ textTransform: 'none', fontWeight: 'bold' }}><Translate translationKey="seeAll"/></Button>
						</Link> : undefined
					}
				/>
				<Grid item container sx={{ display: 'block', flexGrow: 1 }}>
					<SongGrid
						hideArtistName={true}
						songs={topSongs.data.pages.at(0)?.items
							.slice(0, songListSize)
							.map((song) => ({ ...song, artist: artist.data })) ?? []
						}
					/>
				</Grid>
			</>
			}
			{ latestAlbums.data?.pages.at(0)?.items.length != 0 && <>
				<SectionHeader
					heading={<Translate translationKey="albums"/>}
					trailing={(latestAlbums.data?.pages.at(0)?.items.length ?? 0) > albumListSize ?
						<Link href={`/artists/${artistIdentifier}/albums`}>
							<Button variant='contained' color='secondary' endIcon={<ArrowRight/>}
								sx={{ textTransform: 'none', fontWeight: 'bold' }}>
								<Translate translationKey="seeAll"/>
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
					heading={<Translate translationKey="topVideos"/>}
					trailing={(videos.data.pages.at(0)?.items.length ?? 0) > albumListSize ?
						<Link href={`/artists/${artistIdentifier}/videos`}>
							<Button variant='contained' color='secondary' endIcon={<ArrowRight/>}
								sx={{ textTransform: 'none', fontWeight: 'bold' }}>
								<Translate translationKey="seeAll"/>
							</Button>
						</Link> : undefined
					}
				/>
				<Grid item sx={{ overflowX: 'clip', width: '100%' }}>
					<TileRow tiles={videos.data.pages.at(0)?.items.slice(0, albumListSize)
						.map(({ track, ...song }) => <VideoTile
							key={track.id}
							video={{ ...track, song }}
							formatSubtitle={(item) => formatDuration(item.duration).toString()}
						/>) ?? []
					}/>
				</Grid>
			</>
			}
			{ (appearances.data?.pages?.at(0)?.items.length ?? 0) != 0 && <>
				<Divider/>
				<SectionHeader heading={<Translate translationKey="appearsOn"/>}/>
				<Grid item sx={{ overflowX: 'clip', width: '100%' }}>
					<TileRow tiles={
						appearances.data?.pages?.at(0)?.items.map((album) =>
							<AlbumTile
								key={album.id}
								album={album}
							/>)
						?? []
					}/>
				</Grid>
			</>
			}
			{ artist.data.externalIds.length != 0 && <>
				<Divider/>
				<Grid container item spacing={1} sx={{ alignItems: 'center' }}>
					<Grid item sx={{ paddingRight: 3 }}>
						<SectionHeader heading={<Translate translationKey="externalLinks"/>}/>
					</Grid>
					{ artist.data.externalIds.map((externalId) =>
						<Grid item key={externalId.provider.name}>
							<ExternalIdBadge externalId={externalId}/>
						</Grid>) ?? []}
				</Grid>
			</>
			}
		</Grid>
	</Box>;
};

export default ArtistPage;
