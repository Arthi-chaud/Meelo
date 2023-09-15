import { QueryClient } from "../../api/use-query";
import Action from "./action";
import { translate } from "../../i18n/translate";
import { useConfirm } from "material-ui-confirm";
import store from "../../state/store";
import { Chip, Grid } from "@mui/material";
import { useState } from "react";
import toast from "react-hot-toast";
import API from "../../api/api";
import { useMutation } from "react-query";
import { Edit } from "@mui/icons-material";
import Song, { SongType } from "../../models/song";

const SongTypeForm = (props: {
	defaultValue: SongType,
	onSelect: (type: SongType) => void
}) => {
	const [currentType, setType] = useState(props.defaultValue);

	return <>
		<Grid container spacing={2} justifyContent='center'>
			{SongType.filter((type) => type != 'Unknown').map((type) => (
				<Grid item key={type}>
					<Chip
						label={translate(type)}
						variant={type == currentType ? "filled" : "outlined"}
						onClick={() => {
							setType(type);
							props.onSelect(type);
						}}
					/>
				</Grid>
			))}
		</Grid>
	</>;
};

const ChangeSongType = (
	song: Song,
	queryClient: QueryClient,
	confirm: ReturnType<typeof useConfirm>
): Action => {
	const mutation = useMutation((newType: SongType) => {
		return API.updateSong(song.id, newType)
			.then(() => {
				toast.success('Update successful!');
				queryClient.client.invalidateQueries('songs');
				queryClient.client.invalidateQueries('release');
				queryClient.client.invalidateQueries('bsides');
			})
			.catch((error: Error) => toast.error(error.message));
	});

	return {
		label: 'changeSongType',
		icon: <Edit/>,
		disabled: store.getState().user.user?.admin !== true,
		onClick: () => confirm({
			title: translate('changeSongType'),
			description: <SongTypeForm
				defaultValue={song.type}
				onSelect={(type) => mutation.mutate(type)}
			/>,
			cancellationButtonProps: { sx: { display: 'none' } },
			confirmationText: translate('done'),
		})
	};
};

export default ChangeSongType;
