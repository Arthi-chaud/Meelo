import {
	AddIcon, DeleteIcon, EditIcon
} from '../icons';
import {
	Box, Button, Dialog, Grid, Hidden, IconButton, List,
	ListItem, ListItemText, useMediaQuery, useTheme
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import toast from "react-hot-toast";
import { useMutation } from "react-query";
import { useQuery, useQueryClient } from "../../api/use-query";
import API from "../../api/api";
import Library from "../../models/library";
import AdminGrid from "../admin-grid";
import {
	CleanAllLibrariesAction, CleanLibraryAction,
	FetchExternalMetadata,
	ScanAllLibrariesAction, ScanLibraryAction
} from "../actions/library-task";
import { useConfirm } from "material-ui-confirm";
import Action from "../actions/action";
import { useMemo, useState } from "react";
import LibraryForm from "../library-form";
import Translate, { translate, useLanguage } from "../../i18n/translate";
import { RefreshLibraryMetadataAction } from "../actions/refresh-metadata";
import SectionHeader from '../section-header';
import { capitalCase } from "change-case";

const actionButtonStyle = {
	overflow: 'hidden',
	textOverflow: 'ellipsis'
};

const LibrariesSettings = () => {
	const tasks = useQuery(API.getTasks);
	const RunTaskButton = (
		{ icon, label, onClick, variant }: Action & Pick<Parameters<typeof Button>[0], 'variant'>
	) => {
		const theme = useTheme();
		const viewPortIsSmall = useMediaQuery(theme.breakpoints.up('sm'));

		return <Button variant={variant} size='small'
			startIcon={viewPortIsSmall && icon}
			onClick={() => {
				tasks.refetch();
				onClick?.();
			}} sx={actionButtonStyle}
		>
			<Hidden smUp>{icon}</Hidden>
			<Hidden smDown><Translate translationKey={label}/></Hidden>
		</Button>;
	};
	const queryClient = useQueryClient();
	const scanAllLibaries = {
		...ScanAllLibrariesAction,
		onClick: () => {
			tasks.refetch();
			ScanAllLibrariesAction.onClick?.();
		}
	};
	const cleanAllLibaries = {
		...CleanAllLibrariesAction,
		onClick: () => {
			tasks.refetch();
			CleanAllLibrariesAction.onClick?.();
		}
	};
	const fetchMetadata = {
		...FetchExternalMetadata,
		onClick: () => {
			tasks.refetch();
			FetchExternalMetadata.onClick?.();
		}
	};
	const confirm = useConfirm();
	const language = useLanguage();
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [libraryEdit, setLibraryEdit] = useState<Library | undefined>(); // If set, open modal to edit library
	const closeEditModal = () => setLibraryEdit(undefined);
	const closeCreateModal = () => setCreateModalOpen(false);
	const deletionMutation = useMutation((libraryId: number) =>
		API.deleteLibrary(libraryId)
			.then(() => {
				toast.success(translate('libraryDeleted'));
				queryClient.client.invalidateQueries(['libraries']);
			})
			.catch(() => toast.error(translate('libraryDeletionFail'))));
	const createMutation = useMutation((createForm: { name: string, path: string}) =>
		API.createLibrary(createForm.name, createForm.path)
			.then(() => {
				toast.success(translate('libraryCreated'));
				queryClient.client.invalidateQueries(['libraries']);
			})
			.catch((err) => toast.error(err.message)));
	const editMutation = useMutation((updatedLibrary: { id: number, name: string, path: string}) =>
		API.updateLibrary(updatedLibrary.id, updatedLibrary.name, updatedLibrary.path)
			.then(() => {
				toast.success(translate('libraryUpdated'));
				queryClient.client.invalidateQueries(['libraries']);
			})
			.catch((err) => toast.error(err.message)));
	const columns: GridColDef<Library>[] = useMemo(() => [
		{ field: 'name', headerName: translate('name'), flex: 5 },
		{ field: 'clean', headerName: translate('clean'), flex: 3, renderCell: ({ row: library }) =>
			<RunTaskButton variant='outlined' {...CleanLibraryAction(library.id)}/> },
		{ field: 'scan', headerName: translate('scan'), flex: 3, renderCell: ({ row: library }) =>
			<RunTaskButton variant='contained' {...ScanLibraryAction(library.id)}/> },
		{ field: 'refresh', headerName: translate('refreshMetadata'), flex: 3, renderCell: ({ row: library }) =>
			<RunTaskButton variant='outlined' {...RefreshLibraryMetadataAction(library.id)} label='refresh'/> },
		{ field: 'edit', headerName: translate('edit'), flex: 1, renderCell: ({ row: library }) => {
			return <IconButton onClick={() => setLibraryEdit(library)}>
				<EditIcon/>
			</IconButton>;
		} },
		{ field: 'delete', headerName: translate('delete'), flex: 1, renderCell: ({ row: library }) => {
			return <IconButton color='error' onClick={() => confirm({
				title: <Translate translationKey="deleteLibraryAction"/>,
				description: <Translate translationKey="deleteLibraryWarning"/>,
				confirmationText: <Translate translationKey="deleteLibrary"/>,
				confirmationButtonProps: {
					variant: 'outlined',
					color: 'error',
					onClickCapture: () => deletionMutation.mutate(library.id)
				}
			})}>
				<DeleteIcon/>
			</IconButton>;
		} }
	], [language]);

	return <Box>
		<Grid container sx={{ justifyContent: { xs: 'space-evenly', lg: 'flex-end' }, paddingY: 2 }} spacing={{ xs: 1, lg: 2 }}>
			<Grid item>
				<Button variant='contained' startIcon={<AddIcon/>} onClick={() => setCreateModalOpen(true)}>
					<Translate translationKey="createLibrary"/>
				</Button>
			</Grid>
			{[cleanAllLibaries, scanAllLibaries, fetchMetadata].map((action, index) => (
				<Grid item key={'Library-action-' + index}>
					<Button variant={index % 2 ? 'contained' : 'outlined'} startIcon={action.icon} onClick={action.onClick}>
						<Translate translationKey={action.label}/>
					</Button>
				</Grid>
			))}
		</Grid>
		<Dialog open={libraryEdit != undefined} onClose={closeEditModal} fullWidth>
			<LibraryForm defaultValues={libraryEdit} onClose={closeEditModal}
				onSubmit={(fields) => editMutation.mutate({ ...fields, id: libraryEdit!.id })}
			/>
		</Dialog>
		<Dialog open={createModalOpen} onClose={closeCreateModal} fullWidth>
			<LibraryForm onClose={closeCreateModal}
				onSubmit={(fields) => createMutation.mutate(fields)}
			/>
		</Dialog>
		<AdminGrid
			infiniteQuery={API.getLibraries}
			columns={columns.map((column) => ({
				...column,
				headerAlign: column.field == 'name' ? 'left' : 'center',
				align: column.field == 'name' ? 'left' : 'center',
			}))}
		/>
		<Box sx={{ paddingY: 2 }} />
		<SectionHeader
			heading={<Translate translationKey='tasks'/>}
			trailing={<Button onClick={() => tasks.refetch()} variant='contained'>
				<Translate translationKey='refresh'/>
			</Button>}
		/>
		{ tasks.data && <List>
			<ListItem>
				<ListItemText
					primary={<Translate translationKey='current'
						format={(tr) => tr + ': ' + (capitalCase(tasks.data.active?.name ?? translate('none')))}/>
					}
					secondary={tasks.data.active?.description}
				/>
			</ListItem>
			<ListItem>
				<ListItemText
					primary={<Translate translationKey='pending'
						format={(tr) => tr + ': ' + (tasks.data.pending.length || translate('none')) }/>
					}
				/>
			</ListItem>
			{tasks.data.pending.map((task, index) => <ListItem key={'task-' + index}>
				<ListItemText inset primary={capitalCase(task.name)} secondary={task.description}/>
			</ListItem>)}
		</List> }
	</Box>;
};

export default LibrariesSettings;
