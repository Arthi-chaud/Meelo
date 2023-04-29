import { Add, Delete } from "@mui/icons-material";
import {
	Box, Button, Dialog, Grid, Hidden, IconButton, useMediaQuery, useTheme
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import toast from "react-hot-toast";
import { useMutation } from "react-query";
import { useQueryClient } from "../../api/use-query";
import API from "../../api/api";
import Library from "../../models/library";
import AdminGrid from "../admin-grid";
import {
	CleanAllLibrariesAction, CleanLibraryAction,
	FetchExternalMetadata,
	RefreshMetadataLibraryAction,
	ScanAllLibrariesAction, ScanLibraryAction
} from "../actions/library-task";
import { useConfirm } from "material-ui-confirm";
import Action from "../actions/action";
import { useState } from "react";
import LibraryForm from "../library-form";

const actionButtonStyle = {
	overflow: 'hidden',
	textOverflow: 'ellipsis'
};

const RunTaskButton = (
	{ icon, label, onClick, variant }: Action & Pick<Parameters<typeof Button>[0], 'variant'>
) => {
	const theme = useTheme();
	const viewPortIsSmall = useMediaQuery(theme.breakpoints.up('sm'));

	return <Button variant={variant} size='small'
		startIcon={viewPortIsSmall && icon}
		onClick={onClick} sx={actionButtonStyle}
	>
		<Hidden smUp>{icon}</Hidden>
		<Hidden smDown>{label}</Hidden>
	</Button>;
};

const LibrariesSettings = () => {
	const queryClient = useQueryClient();
	const scanAllLibaries = ScanAllLibrariesAction;
	const cleanAllLibaries = CleanAllLibrariesAction;
	const fetchMetadata = FetchExternalMetadata;
	const confirm = useConfirm();
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const closeModal = () => setCreateModalOpen(false);
	const deletionMutation = useMutation((libraryId: number) =>
		API.deleteLibrary(libraryId)
			.then(() => {
				toast.success("Library deleted");
				queryClient.client.invalidateQueries();
			})
			.catch(() => toast.error("Deleting library failed, try again")));
	const createMutation = useMutation((createForm: { name: string, path: string}) =>
		API.createLibrary(createForm.name, createForm.path)
			.then(() => {
				toast.success("Library created");
				queryClient.client.invalidateQueries(['libraries']);
			})
			.catch((err) => toast.error(err.message)));
	const columns: GridColDef<Library>[] = [
		{ field: 'name', headerName: 'Name', flex: 5 },
		{ field: 'clean', headerName: 'Clean', flex: 3, renderCell: ({ row: library }) =>
			<RunTaskButton variant='outlined' {...CleanLibraryAction(library.id)}/> },
		{ field: 'scan', headerName: 'Scan', flex: 3, renderCell: ({ row: library }) =>
			<RunTaskButton variant='contained' {...ScanLibraryAction(library.id)}/> },
		{ field: 'refresh', headerName: 'Refresh metadata', flex: 3, renderCell: ({ row: library }) =>
			<RunTaskButton variant='outlined' {...RefreshMetadataLibraryAction(library.id)} label='Refresh'/> },
		{ field: 'delete', headerName: 'Delete', flex: 1, renderCell: ({ row: library }) => {
			return <IconButton color='error' onClick={() => confirm({
				title: 'Delete a Library',
				description: 'You are about to delete a library. This can not be undone',
				confirmationText: 'Delete Library',
				confirmationButtonProps: {
					variant: 'outlined',
					color: 'error',
					onClickCapture: () => deletionMutation.mutate(library.id)
				}
			})}>
				<Delete/>
			</IconButton>;
		} }
	];

	return <Box>
		<Grid container sx={{ justifyContent: { xs: 'space-evenly', md: 'flex-end' }, paddingY: 2 }} spacing={{ xs: 1, md: 2 }}>
			<Grid item>
				<Button variant='contained' startIcon={<Add/>} onClick={() => setCreateModalOpen(true)}>
					Create Library
				</Button>
			</Grid>
			{[cleanAllLibaries, scanAllLibaries, fetchMetadata].map((action, index) => (
				<Grid item key={'Library-action-' + index}>
					<Button variant={index % 2 ? 'contained' : 'outlined'} startIcon={action.icon} onClick={action.onClick}>
						{action.label}
					</Button>
				</Grid>
			))}
		</Grid>
		<Dialog open={createModalOpen} onClose={closeModal} fullWidth>
			<LibraryForm onClose={closeModal} onSubmit={(fields) => createMutation.mutate(fields)}/>
		</Dialog>
		<AdminGrid
			infiniteQuery={API.getAllLibraries}
			columns={columns.map((column) => ({
				...column,
				headerAlign: column.field == 'name' ? 'left' : 'center',
				align: column.field == 'name' ? 'left' : 'center',
			}))}
		/>
	</Box>;
};

export default LibrariesSettings;
