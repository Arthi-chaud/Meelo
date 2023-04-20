import {
	Add, Edit, PlaylistAdd, PlaylistPlay, QueueMusic
} from "@mui/icons-material";
import Action from "./action";
import toast from "react-hot-toast";
import { playAfter, playNext } from "../../state/playerSlice";
import store from "../../state/store";
import {
	Button, DialogActions, DialogContent, DialogTitle
} from "@mui/material";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import { MeeloInfiniteQueryFn, QueryClient } from "../../api/use-query";
import { useMutation } from "react-query";
import API from "../../api/api";
import Playlist from "../../models/playlist";
import InfiniteList from "../infinite/infinite-list";
import { WideLoadingComponent } from "../loading/loading";
import LoadingPage from "../loading/loading-page";
import ListItem from "../list-item/item";
import Illustration from "../illustration";

export const PlayNextAction = (
	getTrack: () => PromiseLike<Parameters<typeof playNext>[0]>
): Action => ({
	onClick: () => getTrack().then((track) => {
		store.dispatch(playNext(track));
		toast.success(`'${track.track.name}' will play next!`);
	}),
	label: "Play Next",
	icon: <PlaylistPlay/>
});

export const PlayAfterAction = (
	getTrack: () => PromiseLike<Parameters<typeof playAfter>[0]>
): Action => ({
	onClick: () => getTrack().then((track) => {
		store.dispatch(playAfter(track));
		toast.success(`'${track.track.name}' will play after!`);
	}),
	label: "Play After",
	icon: <PlaylistAdd/>
});

type CreateOrUpdatePlaylistFormProps = {
	onSubmit: (newUrl: string) => void;
	onClose: () => void;
	defaultValue?: string
}

const CreateOrUpdatePlaylistForm = (props: CreateOrUpdatePlaylistFormProps) => {
	const defaultValues = { name: props.defaultValue ?? '' };
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const onSubmit = (values: typeof defaultValues) => props.onSubmit(values.name);

	return <>
		<DialogTitle>{props.defaultValue ? 'Update' : 'Create'} Playlist</DialogTitle>
		<form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', height: '100%' }}>
			<DialogContent>
				<HookTextField
					{...registerState('name')}
					textFieldProps={{
						autoFocus: true,
						fullWidth: true,
						label: 'Enter name of the playlist',
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: 'Name is required',
						},
					}}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onClose}>Cancel</Button>
				<Button onClick={props.onClose} type='submit' color='primary' variant="contained">
					{props.defaultValue ? 'Update' : 'Create'}
				</Button>
			</DialogActions>
		</form>
	</>;
};

export const CreatePlaylistAction = (
	queryClient: QueryClient
): Action => ({
	label: 'New',
	icon: <Add/>,
	dialog: ({ close }) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const mutation = useMutation((playlistName: string) => {
			return API.createPlaylist(playlistName)
				.then(() => {
					toast.success("Playlist created!");
					queryClient.client.invalidateQueries('playlists');
				})
				.catch((error: Error) => toast.error(error.message));
		});

		return <CreateOrUpdatePlaylistForm
			onClose={close} onSubmit={(name) => mutation.mutate(name)}
		/>;
	}
});

export const UpdatePlaylistAction = (
	playlist: Playlist,
	queryClient: QueryClient
): Action => ({
	label: 'Update',
	icon: <Edit/>,
	dialog: ({ close }) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const mutation = useMutation((playlistName: string) => {
			return API.updatePlaylist(playlistName, playlist.slug)
				.then(() => {
					toast.success("Playlist updated!");
					queryClient.client.invalidateQueries('playlists');
					queryClient.client.invalidateQueries('playlist');
				})
				.catch((error: Error) => toast.error(error.message));
		});

		return <CreateOrUpdatePlaylistForm
			onClose={close} onSubmit={(name) => mutation.mutate(name)} defaultValue={playlist.name}
		/>;
	}
});

type SelectPlaylistFormProps = {
	playlistQuery: MeeloInfiniteQueryFn<Playlist>,
	onSubmit: (playlistId: number) => void;
	onClose: () => void;
}

const SelectPlaylistForm = (props: SelectPlaylistFormProps) => {
	return <>
		<DialogTitle>Select a playlist</DialogTitle>
		<DialogContent>
			<InfiniteList
				firstLoader={() => <LoadingPage/>}
				loader={() => <WideLoadingComponent/>}
				query={props.playlistQuery}
				render={(item: Playlist) => <ListItem
					title={item.name}
					icon={<Illustration url={item.illustration} fallback={<QueueMusic />} />}
					onClick={() => {
						props.onSubmit(item.id);
						props.onClose();
					}}
				/>}
			/>
		</DialogContent>
		<DialogActions>
			<Button onClick={props.onClose} variant='outlined'>Cancel</Button>
		</DialogActions>
	</>;
};

export const AddToPlaylistAction = (
	songId: number,
	queryClient: QueryClient
): Action => ({
	icon: <PlaylistAdd/>,
	label: 'Add to Playlist',
	dialog: ({ close }) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const mutation = useMutation((playlistId: number) => {
			return API.addSongToPlaylist(songId, playlistId)
				.then(() => {
					toast.success("Song added to Playlist");
					queryClient.client.invalidateQueries('playlists');
					queryClient.client.invalidateQueries('playlist');
				})
				.catch((error: Error) => toast.error(error.message));
		});

		return <SelectPlaylistForm
			onClose={close}
			onSubmit={(playlistId) => mutation.mutate(playlistId)}
			playlistQuery={API.getAllPlaylists}
		/>;
	}
});
