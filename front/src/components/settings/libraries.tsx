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

import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	Grid,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Skeleton,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useConfirm } from "material-ui-confirm";
import { type ComponentProps, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { useQuery as useTanStackQuery } from "react-query";
import { useQuery, useQueryClient } from "~/api/hook";
import { getLibraries, getTasks } from "~/api/queries";
import type Action from "~/components/actions";
import {
	CleanAllLibrariesAction,
	CleanLibraryAction,
	ScanAllLibrariesAction,
	ScanLibraryAction,
} from "~/components/actions/library-task";
import { RefreshLibraryMetadataAction } from "~/components/actions/refresh-metadata";
import AdminGrid from "~/components/admin-grid";
import { AddIcon, DeleteIcon, EditIcon } from "~/components/icons";
import LibraryForm from "~/components/library-form";
import SectionHeader from "~/components/section-header";
import type Library from "~/models/library";
import { toTanStackQuery } from "~/query";

const actionButtonStyle = {
	overflow: "hidden",
	textOverflow: "ellipsis",
};
// Stolen from https://mui.com/material-ui/react-progress/?srsltid=AfmBOoo0dWRio9xMoE_zsN01tte0uKv3clCU6ALkzOVxnB-Ogg5u6guf#circular-with-label
const CircularProgressWithLabel = (
	props: Parameters<typeof CircularProgress>[0] & { value: number },
) => {
	return (
		<Box sx={{ position: "relative", display: "inline-flex" }}>
			<CircularProgress variant="determinate" {...props} />
			<Box
				sx={{
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					position: "absolute",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Typography
					variant="caption"
					component="div"
					sx={{ color: "text.secondary", lineHeight: 1 }}
				>{`${props.value}%`}</Typography>
			</Box>
		</Box>
	);
};

const RunTaskButton = ({
	icon,
	label,
	onClick,
	dialog,
	variant,
}: Action & Pick<ComponentProps<typeof Button>, "variant">) => {
	const theme = useTheme();
	const tasks = useQuery(getTasks);
	const { t } = useTranslation();
	const viewPortIsSmall = useMediaQuery(theme.breakpoints.up("sm"));
	const [modalIsOpen, openModal] = useState(false);

	return (
		<>
			<Button
				variant={variant}
				size="small"
				startIcon={viewPortIsSmall && icon}
				onClick={() => {
					onClick?.();
					dialog && openModal(true);
					tasks.refetch();
				}}
				sx={actionButtonStyle}
			>
				<Box sx={{ display: { xs: "flex", sm: "none" } }}>{icon}</Box>
				<Box sx={{ display: { xs: "none", sm: "flex" } }}>
					{t(label)}
				</Box>
			</Button>

			{dialog && (
				<Dialog
					open={modalIsOpen}
					onClose={() => openModal(false)}
					fullWidth
				>
					{dialog({
						close: () => {
							openModal(false);
							tasks.refetch();
						},
					})}
				</Dialog>
			)}
		</>
	);
};

const LibrariesSettings = () => {
	const queryClient = useQueryClient();
	const api = queryClient.api;
	const tasks = useTanStackQuery({
		...toTanStackQuery(api, () => getTasks()),
		refetchInterval: 1000,
	});
	const { t, i18n } = useTranslation();
	const scanAllLibaries = {
		...ScanAllLibrariesAction(queryClient.api),
		onClick: () => {
			ScanAllLibrariesAction(queryClient.api).onClick?.();
			tasks.refetch();
		},
	};
	const cleanAllLibaries = {
		...CleanAllLibrariesAction(queryClient.api),
		onClick: () => {
			CleanAllLibrariesAction(queryClient.api).onClick?.();
			tasks.refetch();
		},
	};
	const confirm = useConfirm();
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [libraryEdit, setLibraryEdit] = useState<Library | undefined>(); // If set, open modal to edit library
	const closeEditModal = () => setLibraryEdit(undefined);
	const closeCreateModal = () => setCreateModalOpen(false);
	const deletionMutation = useMutation((libraryId: number) =>
		toast
			.promise(api.deleteLibrary(libraryId), {
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
			api
				.createLibrary(createForm.name, createForm.path)
				.then(() => {
					toast.success(t("libraryCreated"));
					queryClient.client.invalidateQueries(["libraries"]);
				})
				.catch((err) => toast.error(err.message)),
	);
	const editMutation = useMutation(
		(updatedLibrary: { id: number; name: string; path: string }) =>
			api
				.updateLibrary(
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
						{...CleanLibraryAction(queryClient.api, library.id)}
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
						{...ScanLibraryAction(queryClient.api, library.id)}
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
				<Grid>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={() => setCreateModalOpen(true)}
					>
						{t("createLibrary")}
					</Button>
				</Grid>
				{[cleanAllLibaries, scanAllLibaries].map((action, index) => (
					<Grid key={`Library-action-${index}`}>
						<Button
							variant={index % 2 ? "contained" : "outlined"}
							startIcon={action.icon}
							onClick={action.onClick}
						>
							{t(action.label)}
						</Button>
					</Grid>
				))}
			</Grid>
			<Dialog
				open={libraryEdit !== undefined}
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
				infiniteQuery={getLibraries}
				columns={columns.map((column) => ({
					...column,
					headerAlign: column.field === "name" ? "left" : "center",
					align: column.field === "name" ? "left" : "center",
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
				<ListItem
					secondaryAction={
						tasks.data &&
						tasks.data.progress !== null && (
							<CircularProgressWithLabel
								size="35px"
								value={tasks.data.progress}
							/>
						)
					}
				>
					<ListItemText
						primary={
							tasks.data ? (
								`${t("current")}: ${
									tasks.data.current_task ?? t("none")
								}`
							) : (
								<Skeleton width={"100px"} />
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
								<Skeleton width={"100px"} />
							)
						}
					/>
				</ListItem>
				{tasks.data?.pending_tasks.map((task, index) => (
					<ListItem key={`task-${index}`}>
						<ListItemText inset primary={task} />
					</ListItem>
				))}
			</List>
		</Box>
	);
};

export default LibrariesSettings;
