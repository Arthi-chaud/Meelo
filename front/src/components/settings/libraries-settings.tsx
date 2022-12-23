import { Delete } from "@mui/icons-material";
import {
	Box, Button, Grid, Hidden, IconButton, useMediaQuery, useTheme
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import API from "../../api/api";
import Library from "../../models/library";
import { Page } from "../infinite/infinite-scroll";
import AdminGrid from "../admin-grid";
import {
	CleanAllLibrariesAction, CleanLibraryAction,
	ScanAllLibrariesAction, ScanLibraryAction
} from "../actions/library-task";
import { useConfirm } from "material-ui-confirm";
import Action from "../actions/action";

const librariesQuery = () => ({
	key: ['libraries'],
	exec: (lastPage: Page<Library>) => API.getAllLibraries(lastPage)
});

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
	const confirm = useConfirm();
	const deletionMutation = useMutation((libraryId: number) =>
		API.deleteLibrary(libraryId)
			.catch(() => toast.error("Deleting library failed, try again"))
			.then(() => {
				toast.success("Library deleted");
				queryClient.invalidateQueries();
			}));
	const columns: GridColDef<Library>[] = [
		{ field: 'name', headerName: 'Name', flex: 5 },
		{ field: 'clean', headerName: 'Clean', flex: 3, renderCell: ({ row: library }) =>
			<RunTaskButton variant='outlined' {...CleanLibraryAction(library.id)}/> },
		{ field: 'scan', headerName: 'Scan', flex: 3, renderCell: ({ row: library }) =>
			<RunTaskButton variant='contained' {...ScanLibraryAction(library.id)}/> },
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
				<Button variant='outlined'
					startIcon={cleanAllLibaries.icon} onClick={cleanAllLibaries.onClick}
				>
					{cleanAllLibaries.label}
				</Button>
			</Grid>
			<Grid item>
				<Button variant='contained'
					startIcon={scanAllLibaries.icon} onClick={scanAllLibaries.onClick}
				>
					{scanAllLibaries.label}
				</Button>
			</Grid>
		</Grid>
		<AdminGrid
			infiniteQuery={librariesQuery}
			columns={columns.map((column) => ({
				...column,
				headerAlign: column.field == 'name' ? 'left' : 'center',
				align: column.field == 'name' ? 'left' : 'center',
			}))}
		/>
	</Box>;
};

export default LibrariesSettings;
