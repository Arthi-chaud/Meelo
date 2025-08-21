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
import {
	useMutation,
	useQuery as useTanStackQuery,
} from "@tanstack/react-query";
import { useConfirm } from "material-ui-confirm";
import { type ComponentProps, useMemo } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getLibraries, getTasks } from "@/api/queries";
import { toTanStackQuery } from "@/api/query";
import type Library from "@/models/library";
import { AddIcon, DeleteIcon, EditIcon } from "@/ui/icons";
import { useQuery, useQueryClient } from "~/api";
import type Action from "~/components/actions";
import {
	CleanAllLibrariesAction,
	CleanLibraryAction,
	ScanAllLibrariesAction,
	ScanLibraryAction,
} from "~/components/actions/library-task";
import { RefreshLibraryMetadataAction } from "~/components/actions/refresh-metadata";
import AdminGrid from "~/components/admin-grid";
import LibraryForm from "~/components/library-form";
import SectionHeader from "~/components/section-header";
import { useModal } from "../modal";

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
	const [openModal, closeModal] = useModal();
	const tasks = useQuery(getTasks);
	const { t } = useTranslation();
	const viewPortIsSmall = useMediaQuery(theme.breakpoints.up("sm"));

	return (
		<Button
			variant={variant}
			size="small"
			startIcon={viewPortIsSmall && icon}
			onClick={() => {
				onClick?.();
				if (dialog) {
					openModal(() =>
						dialog({
							close: () => {
								closeModal();
								tasks.refetch();
							},
						}),
					);
				}
				tasks.refetch();
			}}
			sx={actionButtonStyle}
		>
			<Box sx={{ display: { xs: "flex", sm: "none" } }}>{icon}</Box>
			<Box sx={{ display: { xs: "none", sm: "flex" } }}>{t(label)}</Box>
		</Button>
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
	const [openModal, closeModal] = useModal();
	const deletionMutation = useMutation({
		mutationFn: (libraryId: number) =>
			toast
				.promise(api.deleteLibrary(libraryId), {
					loading: t("toasts.library.deletionRunning"),
					success: t("toasts.library.deleted"),
					error: t("toasts.library.deletionFail"),
				})
				.then(() => {
					queryClient.client.invalidateQueries({
						queryKey: ["libraries"],
					});
				}),
	});
	const createMutation = useMutation({
		mutationFn: (createForm: { name: string; path: string }) =>
			api
				.createLibrary(createForm.name, createForm.path)
				.then(() => {
					toast.success(t("toasts.library.created"));
					queryClient.client.invalidateQueries({
						queryKey: ["libraries"],
					});
				})
				.catch((err) => toast.error(err.message)),
	});
	const editMutation = useMutation({
		mutationFn: (updatedLibrary: {
			id: number;
			name: string;
			path: string;
		}) =>
			api
				.updateLibrary(
					updatedLibrary.id,
					updatedLibrary.name,
					updatedLibrary.path,
				)
				.then(() => {
					toast.success(t("toasts.library.updated"));
					queryClient.client.invalidateQueries({
						queryKey: ["libraries"],
					});
				})
				.catch((err) => toast.error(err.message)),
	});
	const columns: GridColDef<Library>[] = useMemo(
		() => [
			{
				field: "name",
				headerName: t("settings.libraries.nameColumn"),
				flex: 5,
			},
			{
				field: "clean",
				headerName: t("tasks.clean"),
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
				headerName: t("tasks.scan"),
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
				headerName: t("tasks.refreshMetadata"),
				flex: 3,
				renderCell: ({ row: library }) => (
					<RunTaskButton
						variant="outlined"
						{...RefreshLibraryMetadataAction(library.id, t)}
						label="tasks.refresh"
					/>
				),
			},
			{
				field: "edit",
				headerName: t("form.edit"),
				flex: 1,
				renderCell: ({ row: library }) => {
					return (
						<IconButton
							onClick={() =>
								openModal(() => (
									<LibraryForm
										defaultValues={library}
										onClose={closeModal}
										onSubmit={(fields) =>
											editMutation.mutate({
												...fields,
												id: library.id,
											})
										}
									/>
								))
							}
						>
							<EditIcon />
						</IconButton>
					);
				},
			},
			{
				field: "delete",
				headerName: t("actions.delete"),
				flex: 1,
				renderCell: ({ row: library }) => {
					return (
						<IconButton
							color="error"
							onClick={() =>
								confirm({
									title: t("actions.library.delete"),
									description: t(
										"actions.library.deletionWarning",
									),
									confirmationText: t(
										"actions.library.delete",
									),
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
						onClick={() =>
							openModal(() => (
								<LibraryForm
									onClose={closeModal}
									onSubmit={(fields) =>
										createMutation.mutate(fields)
									}
								/>
							))
						}
					>
						{t("actions.library.create")}
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
				heading={t("settings.libraries.tasks.label")}
				trailing={
					<Button onClick={() => tasks.refetch()} variant="contained">
						{t("tasks.refresh")}
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
								`${t("settings.libraries.tasks.current")}: ${
									tasks.data.current_task ??
									t("settings.libraries.tasks.none")
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
								`${t("settings.libraries.tasks.pending")}: ${
									tasks.data.pending_tasks.length ||
									t("settings.libraries.tasks.none")
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
