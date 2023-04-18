import { QueryClient } from "../../api/use-query";
import {
	Button, DialogActions, DialogContent, DialogTitle
} from "@mui/material";
import Action from "./action";
import store from "../../state/store";
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import { toast } from "react-hot-toast";
import API from "../../api/api";
import { useMutation } from "react-query";
import { HookTextField, useHookForm } from "mui-react-hook-form-plus";

type IllustrationUpdateFormType = {
	onSubmit: (newUrl: string) => void;
	onClose: () => void;
}

const IllustrationUpdateForm = (props: IllustrationUpdateFormType) => {
	const defaultValues = { url: '' };
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const onSubmit = (values: typeof defaultValues) => props.onSubmit(values.url);

	return <>
		<DialogTitle>Update Illustration</DialogTitle>
		<form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', height: '100%' }}>
			<DialogContent>
				<HookTextField
					{...registerState('url')}
					textFieldProps={{
						autoFocus: true,
						fullWidth: true,
						label: 'Enter URL of the new illustration',
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: 'URL is required',
						},
					}}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onClose}>Cancel</Button>
				<Button type='submit' onClick={props.onClose}>Update</Button>
			</DialogActions>
		</form>
	</>;
};

const UpdateIllustrationAction = (
	queryClient: QueryClient,
	resourceId: number | string,
	resourceType: 'artist' | 'track' | 'release' | 'playlist',
): Action => {
	const textFieldId = `update-illustration-${resourceType}-${resourceId}`;
	const mutation = useMutation(async (newUrl: string) => {
		const updator = resourceType == 'artist'
			? API.updateArtistIllustration
			: resourceType == 'release'
				? API.updateReleaseIllustration
				: resourceType == 'playlist'
					? API.updatePlaylistIllustration
					: API.updateTrackIllustration;

		return updator(resourceId, newUrl)
			.then(() => {
				toast.success('Illustration updated!');
				queryClient.client.invalidateQueries(resourceType);
				queryClient.client.invalidateQueries(resourceType + 's');
			})
			.catch(() => toast.error('Illustration update failed'));
	});

	return {
		label: "Change Illustration",
		disabled: store.getState().user.user?.admin !== true,
		icon: <InsertPhotoIcon />,
		dialog: (controls) => <IllustrationUpdateForm
			onClose={controls.close}
			onSubmit={(url) => mutation.mutate(url)}
		/>
	};
};

const UpdateArtistIllustrationAction = (
	queryClient: QueryClient,
	artistSlugOrId: number | string
) => UpdateIllustrationAction(
	queryClient, artistSlugOrId, 'artist'
);

const UpdateReleaseIllustrationAction = (
	queryClient: QueryClient,
	releaseSlugOrId: number | string
) => UpdateIllustrationAction(
	queryClient, releaseSlugOrId, 'release'
);

const UpdateTrackIllustrationAction = (
	queryClient: QueryClient,
	trackSlugOrId: number | string
) => UpdateIllustrationAction(
	queryClient, trackSlugOrId, 'track'
);

const UpdatePlaylistIllustrationAction = (
	queryClient: QueryClient,
	playlistSlugOrId: number | string
) => UpdateIllustrationAction(
	queryClient, playlistSlugOrId, 'playlist'
);

export { UpdateArtistIllustrationAction, UpdateReleaseIllustrationAction, UpdateTrackIllustrationAction, UpdatePlaylistIllustrationAction };
