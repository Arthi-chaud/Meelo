import {
	Add, PlaylistAdd, PlaylistPlay
} from "@mui/icons-material";
import Action from "./action";
import toast from "react-hot-toast";
import { playAfter, playNext } from "../../state/playerSlice";
import store from "../../state/store";
import {
	Button, DialogActions, DialogContent, DialogTitle
} from "@mui/material";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";
import { QueryClient } from "../../api/use-query";
import { useMutation } from "react-query";
import API from "../../api/api";

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

