import { QueryClient } from "../../api/use-query";
import Action from "../actions/action";
import { translate } from "../../i18n/translate";
import { useConfirm } from "material-ui-confirm";
import Album, { AlbumType } from "../../models/album";
import store from "../../state/store";
import { Chip, Grid } from "@mui/material";
import { useState } from "react";
import toast from "react-hot-toast";
import API from "../../api/api";
import { useMutation } from "react-query";
import { EditIcon } from "../icons";

const AlbumTypeForm = (props: {
	defaultValue: AlbumType;
	onSelect: (type: AlbumType) => void;
}) => {
	const [currentType, setType] = useState(props.defaultValue);

	return (
		<>
			<Grid container spacing={2} justifyContent="center">
				{AlbumType.map((type) => (
					<Grid item key={type}>
						<Chip
							label={translate(type)}
							variant={
								type == currentType ? "filled" : "outlined"
							}
							onClick={() => {
								setType(type);
								props.onSelect(type);
							}}
						/>
					</Grid>
				))}
			</Grid>
		</>
	);
};

const ChangeAlbumType = (
	album: Album,
	queryClient: QueryClient,
	confirm: ReturnType<typeof useConfirm>,
): Action => {
	const mutation = useMutation((newType: AlbumType) => {
		return API.updateAlbum(album.id, newType)
			.then(() => {
				queryClient.client.invalidateQueries("albums");
			})
			.catch((error: Error) => toast.error(error.message));
	});

	return {
		label: "changeAlbumType",
		icon: <EditIcon />,
		disabled: store.getState().user.user?.admin !== true,
		onClick: () =>
			confirm({
				title: translate("changeAlbumType"),
				description: (
					<AlbumTypeForm
						defaultValue={album.type}
						onSelect={(type) => mutation.mutate(type)}
					/>
				),
				cancellationButtonProps: { sx: { display: "none" } },
				confirmationText: translate("done"),
			}),
	};
};

export default ChangeAlbumType;
