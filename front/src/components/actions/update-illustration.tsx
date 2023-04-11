import { useConfirm } from "material-ui-confirm";
import { QueryClient } from "../../api/use-query";
import { TextField } from "@mui/material";
import Action from "./action";
import store from "../../state/store";
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import { toast } from "react-hot-toast";
import { useState } from "react";
import API from "../../api/api";
import { useMutation } from "react-query";

const IllustrationForm = ({ id }: { id: string }) => {
	const [value, setValue] = useState<string>('');

	return <TextField
		autoFocus
		label="Enter the URL of the new illustration"
		type="url"
		id={id}
		fullWidth
		value={value}
		variant="standard"
		onChange={(change) => {
			setValue(change.target.value.toString());
		}}
	/>;
};

const UpdateIllustrationAction = (
	confirm: ReturnType<typeof useConfirm>,
	queryClient: QueryClient,
	resourceId: number | string,
	resourceType: 'artist' | 'track' | 'release',
): Action => {
	const textFieldId = `update-illustration-${resourceType}-${resourceId}`;
	const mutation = useMutation(async (newUrl: string) => {
		const updator = resourceType == 'artist'
			? API.updateArtistIllustration
			: resourceType == 'release'
				? API.updateReleaseIllustration
				: API.updateTrackIllustration;

		return updator(resourceId, newUrl)
			.then(() => {
				toast.success('Illustration updated!');
				queryClient.client.invalidateQueries();
			})
			.catch(() => toast.error('Illustration update failed'));
	});

	return {
		label: "Change Illustration",
		disabled: store.getState().user.user?.admin !== true,
		icon: <InsertPhotoIcon/>,
		onClick: () => confirm({

			title: "Update illustration",
			content: <IllustrationForm id={textFieldId}/>,
			confirmationText: "Update",
			confirmationButtonProps: {
				color: 'secondary',
				variant: 'outlined',
				onClickCapture: () => {
					const textField: any = document.getElementById(textFieldId)!;
					const newUrl: string = textField.value;

					if (!newUrl) {
						toast.error('URL should not be empty');
						return;
					}
					mutation.mutate(newUrl);
				}
			}
		})
	};
};

const UpdateArtistIllustrationAction = (
	confirm: ReturnType<typeof useConfirm>,
	queryClient: QueryClient,
	artistSlugOrId: number | string
) => UpdateIllustrationAction(
	confirm, queryClient, artistSlugOrId, 'artist'
);

const UpdateReleaseIllustrationAction = (
	confirm: ReturnType<typeof useConfirm>,
	queryClient: QueryClient,
	releaseSlugOrId: number | string
) => UpdateIllustrationAction(
	confirm, queryClient, releaseSlugOrId, 'release'
);

const UpdateTrackIllustrationAction = (
	confirm: ReturnType<typeof useConfirm>,
	queryClient: QueryClient,
	trackSlugOrId: number | string
) => UpdateIllustrationAction(
	confirm, queryClient, trackSlugOrId, 'track'
);

export { UpdateArtistIllustrationAction, UpdateReleaseIllustrationAction, UpdateTrackIllustrationAction };
