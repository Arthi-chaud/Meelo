/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { AddIcon, DeleteIcon, EditIcon } from "../icons";
import {
	Box,
	Button,
	Dialog,
	Grid,
	Hidden,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Skeleton,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import toast from "react-hot-toast";
import { useMutation } from "react-query";
import { useQuery, useQueryClient } from "../../api/use-query";
import API from "../../api/api";
import Library from "../../models/library";
import AdminGrid from "../admin-grid";
import {
	CleanAllLibrariesAction,
	CleanLibraryAction,
	FetchExternalMetadata,
	ScanAllLibrariesAction,
	ScanLibraryAction,
} from "../actions/library-task";
import { useConfirm } from "material-ui-confirm";
import Action from "../actions/action";
import { ComponentProps, useMemo, useState } from "react";
import LibraryForm from "../library-form";
import { RefreshLibraryMetadataAction } from "../actions/refresh-metadata";
import SectionHeader from "../section-header";
import { useTranslation } from "react-i18next";

const actionButtonStyle = {
	overflow: "hidden",
	textOverflow: "ellipsis",
};

const LibrariesSettings = () => {
	const tasks = useQuery(API.getTasks);
	const { t, i18n } = useTranslation();
	const RunTaskButton = ({
		icon,
		label,
		onClick,
		variant,
	}: Action & Pick<ComponentProps<typeof Button>, "variant">) => {
		const theme = useTheme();
		const viewPortIsSmall = useMediaQuery(theme.breakpoints.up("sm"));

		return (
			<Button
				variant={variant}
				size="small"
				startIcon={viewPortIsSmall && icon}
				onClick={() => {
					tasks.refetch();
					onClick?.();
				}}
				sx={actionButtonStyle}
			>
				<Hidden smUp>{icon}</Hidden>
				<Hidden smDown>{t(label)}</Hidden>
			</Button>
		);
	};
	const queryClient = useQueryClient();
	const scanAllLibaries = {
		...ScanAllLibrariesAction,
		onClick: () => {
			tasks.refetch();
			ScanAllLibrariesAction.onClick?.();
		},
	};
	const cleanAllLibaries = {
		...CleanAllLibrariesAction,
		onClick: () => {
			tasks.refetch();
			CleanAllLibrariesAction.onClick?.();
		},
	};
	const fetchMetadata = {
		...FetchExternalMetadata,
		onClick: () => {
			tasks.refetch();
			FetchExternalMetadata.onClick?.();
		},
	};
	const confirm = useConfirm();
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [libraryEdit, setLibraryEdit] = useState<Library | undefined>(); // If set, open modal to edit library
	const closeEditModal = () => setLibraryEdit(undefined);
	const closeCreateModal = () => setCreateModalOpen(false);
	const deletionMutation = useMutation((libraryId: number) =>
		toast
			.promise(API.deleteLibrary(libraryId), {
				loading: t("deletingLibrary"),
				success: t("libraryDeleted"),
				error: t("libraryDeletionFail"),
			})
			.then(() => {
				queryClient.client.invalidateQueries(["libraries"]);
			}),
	);
	const createMutation = useMutation(
		(createForm: { name: string; path: string }) =>
			API.createLibrary(createForm.name, createForm.path)
				.then(() => {
					toast.success(t("libraryCreated"));
					queryClient.client.invalidateQueries(["libraries"]);
				})
				.catch((err) => toast.error(err.message)),
	);
	const editMutation = useMutation(
		(updatedLibrary: { id: number; name: string; path: string }) =>
			API.updateLibrary(
				updatedLibrary.id,
				updatedLibrary.name,
				updatedLibrary.path,
			)
				.then(() => {
					toast.success(t("libraryUpdated"));
					queryClient.client.invalidateQueries(["libraries"]);
				})
				.catch((err) => toast.error(err.message)),
	);
	const columns: GridColDef<Library>[] = useMemo(
		() => [
			{ field: "name", headerName: t("name"), flex: 5 },
			{
				field: "clean",
				headerName: t("clean"),
				flex: 3,
				renderCell: ({ row: library }) => (
					<RunTaskButton
						variant="outlined"
						{...CleanLibraryAction(library.id)}
					/>
				),
			},
			{
				field: "scan",
				headerName: t("scan"),
				flex: 3,
				renderCell: ({ row: library }) => (
					<RunTaskButton
						variant="contained"
						{...ScanLibraryAction(library.id)}
					/>
				),
			},
			{
				field: "refresh",
				headerName: t("refreshMetadata"),
				flex: 3,
				renderCell: ({ row: library }) => (
					<RunTaskButton
						variant="outlined"
						{...RefreshLibraryMetadataAction(library.id, t)}
						label="refresh"
					/>
				),
			},
			{
				field: "edit",
				headerName: t("edit"),
				flex: 1,
				renderCell: ({ row: library }) => {
					return (
						<IconButton onClick={() => setLibraryEdit(library)}>
							<EditIcon />
						</IconButton>
					);
				},
			},
			{
				field: "delete",
				headerName: t("delete"),
				flex: 1,
				renderCell: ({ row: library }) => {
					return (
						<IconButton
							color="error"
							onClick={() =>
								confirm({
									title: t("deleteLibraryAction"),
									description: t("deleteLibraryWarning"),
									confirmationText: t("deleteLibrary"),
									confirmationButtonProps: {
										variant: "outlined",
										color: "error",
										onClickCapture: () =>
											deletionMutation.mutate(library.id),
									},
								})
							}
						>
							<DeleteIcon />
						</IconButton>
					);
				},
			},
		],
		[i18n.language],
	);

	return (
		<Box>
			<Grid
				container
				sx={{
					justifyContent: { xs: "space-evenly", lg: "flex-end" },
					paddingY: 2,
				}}
				spacing={{ xs: 1, lg: 2 }}
			>
				<Grid item>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={() => setCreateModalOpen(true)}
					>
						{t("createLibrary")}
					</Button>
				</Grid>
				{[cleanAllLibaries, scanAllLibaries, fetchMetadata].map(
					(action, index) => (
						<Grid item key={"Library-action-" + index}>
							<Button
								variant={index % 2 ? "contained" : "outlined"}
								startIcon={action.icon}
								onClick={action.onClick}
							>
								{t(action.label)}
							</Button>
						</Grid>
					),
				)}
			</Grid>
			<Dialog
				open={libraryEdit != undefined}
				onClose={closeEditModal}
				fullWidth
			>
				<LibraryForm
					defaultValues={libraryEdit}
					onClose={closeEditModal}
					onSubmit={(fields) =>
						editMutation.mutate({ ...fields, id: libraryEdit!.id })
					}
				/>
			</Dialog>
			<Dialog open={createModalOpen} onClose={closeCreateModal} fullWidth>
				<LibraryForm
					onClose={closeCreateModal}
					onSubmit={(fields) => createMutation.mutate(fields)}
				/>
			</Dialog>
			<AdminGrid
				infiniteQuery={API.getLibraries}
				columns={columns.map((column) => ({
					...column,
					headerAlign: column.field == "name" ? "left" : "center",
					align: column.field == "name" ? "left" : "center",
				}))}
			/>
			<Box sx={{ paddingY: 2 }} />
			<SectionHeader
				heading={t("tasks")}
				trailing={
					<Button onClick={() => tasks.refetch()} variant="contained">
						{t("refresh")}
					</Button>
				}
			/>
			<List>
				<ListItem>
					<ListItemText
						primary={
							tasks.data ? (
								`${t("current")}: ${
									tasks.data.current_task ?? t("none")
								}`
							) : (
								<Skeleton />
							)
						}
					/>
				</ListItem>
				<ListItem>
					<ListItemText
						primary={
							tasks.data ? (
								`${t("pending")}: ${
									tasks.data.pending_tasks.length || t("none")
								}`
							) : (
								<Skeleton />
							)
						}
					/>
				</ListItem>
				{tasks.data?.pending_tasks.map((task, index) => (
					<ListItem key={"task-" + index}>
						<ListItemText inset primary={task} />
					</ListItem>
				))}
			</List>
		</Box>
	);
};

export default LibrariesSettings;
