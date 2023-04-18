import { useRouter } from "next/router";
import API from "../../../api/api";
import RelationPageHeader from "../../../components/relation-page-header/relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import getSlugOrId from "../../../utils/getSlugOrId";
import { useQueries, useQuery } from "../../../api/use-query";
import PlaylistContextualMenu from "../../../components/contextual-menu/playlist-contextual-menu";
import LoadingPage from "../../../components/loading/loading-page";
import Illustration from "../../../components/illustration";
import { Divider, Stack } from "@mui/material";
import Artist from "../../../models/artist";
import { useDispatch } from "react-redux";
import { playTracks } from "../../../state/playerSlice";
import { TrackWithRelations } from "../../../models/track";
import { SongWithRelations } from "../../../models/song";
import { Audiotrack } from "@mui/icons-material";
import ListItem from "../../../components/list-item/item";
import SongContextualMenu from "../../../components/contextual-menu/song-contextual-menu";
import { PlaylistEntry } from "../../../models/playlist";

const playlistQuery = (idOrSlug: number | string) => API.getPlaylist(idOrSlug, ['entries']);
const masterTrackQuery = (songId: number | string) => API.getMasterTrack(songId, ['release']);

export const getServerSideProps = prepareSSR((context) => {
	const playlistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { playlistIdentifier },
		queries: [playlistQuery(playlistIdentifier)]
	};
});

type PlaylistEntryItemProps = {
	onClick: () => void;
	entry: PlaylistEntry & SongWithRelations<'artist'>
}

const PlaylistEntryItem = ({ entry, onClick }: PlaylistEntryItemProps) => (
	<ListItem
		icon={<Illustration url={entry.illustration} fallback={<Audiotrack/>}/>}
		title={entry.name}
		onClick={onClick}
		trailing={<SongContextualMenu song={entry} entryId={entry.entryId}/>}
		secondTitle={entry.artist.name}
	/>
);

const PlaylistPage = (
	{ playlistIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();
	const dispatch = useDispatch();

	playlistIdentifier ??= getSlugOrId(router.query);
	const playlist = useQuery(playlistQuery, playlistIdentifier);
	const artistsQueries = useQueries(
		...playlist.data?.entries.map(
			({ artistId }): Parameters<typeof useQuery<Artist, Parameters<typeof API.getArtist>>> =>
				[API.getArtist, artistId]
		) ?? []
	);
	const masterTracksQueries = useQueries(
		...playlist.data?.entries.map(
			({ id }): Parameters<typeof useQuery<TrackWithRelations<'release'>, Parameters<typeof masterTrackQuery>>> =>
				[masterTrackQuery, id]
		) ?? []
	);

	if (!playlist.data ||
		artistsQueries.find((query) => !query.data) ||
		masterTracksQueries.find((query) => !query.data)) {
		return <LoadingPage/>;
	}
	const artists = artistsQueries.map((query) => query.data!);
	const masterTracks = masterTracksQueries.map((query) => query.data!);
	const entries = playlist.data.entries.map((entry) => ({
		...entry,
		track: masterTracks.find((master) => master.songId == entry.id)!,
		artist: artists.find((artist) => artist.id == entry.artistId)!
	}));
	const playPlaylist = (fromIndex: number) => dispatch(playTracks({
		tracks: entries.map((entry) => ({
			track: entry.track,
			artist: entry.artist,
			release: entry.track.release
		})),
		cursor: fromIndex
	}));

	return <>
		<RelationPageHeader
			illustration={<Illustration url={playlist.data.illustration}/>}
			title={playlist.data.name}
			trailing={<PlaylistContextualMenu playlist={playlist.data}/>}
		/>
		<Divider sx={{ marginY: 2 }}/>
		<Stack spacing={1}>
			{entries.map((entry, index) => <PlaylistEntryItem key={entry.id}
				entry={entry}
				onClick={() => playPlaylist(index)} />)}
		</Stack>
	</>;
};

export default PlaylistPage;
