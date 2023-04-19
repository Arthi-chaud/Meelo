import { useRouter } from "next/router";
import API from "../../../api/api";
import RelationPageHeader from "../../../components/relation-page-header/relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import getSlugOrId from "../../../utils/getSlugOrId";
import { useQueries, useQuery } from "../../../api/use-query";
import PlaylistContextualMenu from "../../../components/contextual-menu/playlist-contextual-menu";
import LoadingPage from "../../../components/loading/loading-page";
import Illustration from "../../../components/illustration";
import {
	Box,
	Button, Divider, Grid, IconButton, Stack
} from "@mui/material";
import Artist from "../../../models/artist";
import { useDispatch } from "react-redux";
import { playTracks } from "../../../state/playerSlice";
import { TrackWithRelations } from "../../../models/track";
import { SongWithRelations } from "../../../models/song";
import {
	Audiotrack, Delete, Done, DragHandle, Edit, MoreVert
} from "@mui/icons-material";
import ListItem from "../../../components/list-item/item";
import SongContextualMenu from "../../../components/contextual-menu/song-contextual-menu";
import { PlaylistEntry } from "../../../models/playlist";
import { useState } from "react";
import {
	DragDropContext, Draggable, Droppable
} from "react-beautiful-dnd";
import toast from "react-hot-toast";
import { useMutation } from "react-query";

const playlistQuery = (idOrSlug: number | string) => API.getPlaylist(idOrSlug, ['entries']);
const masterTrackQuery = (songId: number | string) => API.getMasterTrack(songId, ['release']);

export const getServerSideProps = prepareSSR((context) => {
	const playlistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { playlistIdentifier },
		queries: [playlistQuery(playlistIdentifier)]
	};
});

type DragAndDropPlaylistProps = {
	entries: (PlaylistEntry & SongWithRelations<'artist'>)[],
	onDropped: (entries: (PlaylistEntry & SongWithRelations<'artist'>)[]) => void;
}

const DragAndDropPlaylist = (props: DragAndDropPlaylistProps) => {
	return <DragDropContext onDragEnd={(result) => {
		if (result.destination) {
			const redordered = props.entries;
			const [removed] = redordered.splice(result.source.index, 1);

			redordered.splice(result.destination.index, 0, removed);
			props.onDropped(redordered);
		}
	}}>
		<Droppable droppableId="droppable-playlist-entries">{(provided) => <div
			{...provided.droppableProps}
			ref={provided.innerRef}
		>
			<Stack spacing={1}>
				{props.entries.map((playlistItem, index) =>
					<Draggable draggableId={index.toString()}
						key={index} index={index}
					>
						{(providedChild) => <div
							ref={providedChild.innerRef}
							{...providedChild.draggableProps}
							style={{ ...providedChild.draggableProps.style }}
						>
							<ListItem
								title={playlistItem.name}
								secondTitle={playlistItem.artist.name}
								icon={<Box {...providedChild.dragHandleProps}
									sx={{ aspectRatio: '1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
									<DragHandle/>
								</Box>}
								onClick={() => {}}
								trailing={<IconButton disabled><MoreVert/></IconButton>}
							/>
						</div>
						}
					</Draggable>)}
				{provided.placeholder}
			</Stack>
		</div>}</Droppable>
	</DragDropContext>;
};

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
	const [editState, setEditState] = useState(false);
	const [tempPlaylistEdit, setTempEdit] = useState<(PlaylistEntry & SongWithRelations<'artist'>)[]>([]);

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
	const reorderMutation = useMutation((reorderedEntries: number[]) => {
		return API.reorderPlaylist(playlistIdentifier, reorderedEntries)
			.then(() => {
				toast.success('Playlist Reordered');
				return playlist.refetch();
			})
			.catch(() => toast.error('Playlist reorder failed'));
	});

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
		{ editState
			? <DragAndDropPlaylist entries={tempPlaylistEdit} onDropped={setTempEdit}/>
			: <Stack spacing={1}>
				{entries.map((entry, index) => <PlaylistEntryItem key={entry.id}
					entry={entry}
					onClick={() => playPlaylist(index)} />)}
			</Stack>
		}
		<Divider sx={{ marginY: 2 }}/>
		<Grid container direction={{ xs: 'column', sm: 'row' }}
			spacing={1} sx={{ justifyContent: { xs: 'space-evenly', sm: 'end' } }}
		>
			<Grid item>
				<Button
					variant={editState ? 'contained' : "outlined"}
					color='primary'
					startIcon={editState ? <Done/> : <Edit/>}
					sx={{ width: '100%' }}
					onClick={() => {
						if (editState) {
							const editComparison = entries.map((entry, index) => ({
								oldEntryId: entry.entryId,
								newEntryId: tempPlaylistEdit.at(index)!.entryId,
								index
							}));
							const changes = editComparison
								.filter(({ oldEntryId, newEntryId }) => newEntryId !== oldEntryId);

							if (changes.length != 0) {
								reorderMutation.mutateAsync(
									tempPlaylistEdit.map(({ entryId }) => entryId)
								).finally(() => setEditState(false));
							} else {
								setEditState(false);
							}
						} else {
							setEditState(true);
							// To set the state before passing it to the dragndrop list
							setTempEdit(entries);
						}
					}}
				>
					{editState ? 'Done' : 'Edit'}
				</Button>
			</Grid>
			<Grid item>
				<Button variant="outlined" color='error' startIcon={<Delete/>} sx={{ width: '100%' }}>
					Delete
				</Button>
			</Grid>
		</Grid>
	</>;
};

export default PlaylistPage;
