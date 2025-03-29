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

import { Box, Checkbox, IconButton, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import API from "api/api";
import { useQueryClient } from "api/use-query";
import AdminGrid from "components/admin-grid";
import { DeleteIcon } from "components/icons";
import { useAtom } from "jotai";
import { useConfirm } from "material-ui-confirm";
import type User from "models/user";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { userAtom } from "state/user";

const DeleteButton = ({
	userId,
	disabled,
}: {
	userId: number;
	disabled: boolean;
}) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const userDeletionMutation = useMutation(() =>
		API.deleteUser(userId)
			.catch(() => toast.error(t("userDeletionFail")))
			.then(() => {
				toast.success(t("userDeleted"));
				queryClient.client.invalidateQueries();
			}),
	);

	return (
		<IconButton
			color="error"
			disabled={disabled}
			onClick={() =>
				confirm({
					title: t("warning"),
					description: t("deleteUserWarning"),
					confirmationText: t("deleteUser"),
					confirmationButtonProps: {
						variant: "outlined",
						color: "error",
						onClickCapture: () => userDeletionMutation.mutate(),
					},
				})
			}
		>
			<DeleteIcon />
		</IconButton>
	);
};

const UsersSettings = () => {
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const [currentUser] = useAtom(userAtom);
	const userMutation = useMutation(
		({
			user,
			status,
		}: {
			user: User;
			status: Parameters<typeof API.updateUser>[1];
		}) =>
			API.updateUser(user.id, status)
				.catch(() => toast.error(t("userUpdateFail")))
				.then(() => {
					const toastMessages: string[] = [];

					if (status.enabled === true) {
						toastMessages.push(t("userNowEnabled"));
					} else if (status.enabled === false) {
						toastMessages.push(t("userNowDisabled"));
					}
					if (status.admin === true) {
						toastMessages.push(t("userNowAdmin"));
					} else if (status.admin === false) {
						toastMessages.push(t("userNowDisabled"));
					}
					toastMessages.forEach((message) => toast.success(message));
					queryClient.client.invalidateQueries();
				}),
	);
	const columns: GridColDef<User>[] = [
		{
			field: "name",
			headerName: t("name"),
			flex: 7,
			renderCell: ({ row: user }) => {
				return (
					<Typography display="inline-flex">
						{user.name}
						{user.id === currentUser?.id && (
							<Typography color="grey" paddingX={1}>
								{t("you")}
							</Typography>
						)}
					</Typography>
				);
			},
		},
		{
			field: "enabled",
			headerName: t("enabled"),
			flex: 2,
			renderCell: ({ row: user }) => {
				return (
					<Checkbox
						checked={user.enabled}
						disabled={user.id === currentUser?.id}
						onChange={(event) =>
							userMutation.mutate({
								user,
								status: { enabled: event.target.checked },
							})
						}
					/>
				);
			},
		},
		{
			field: "admin",
			headerName: t("admin"),
			flex: 2,
			renderCell: ({ row: user }) => {
				return (
					<Checkbox
						checked={user.admin}
						disabled={user.id === currentUser?.id}
						onChange={(event) =>
							userMutation.mutate({
								user,
								status: { admin: event.target.checked },
							})
						}
					/>
				);
			},
		},
		{
			field: "delete",
			headerName: t("delete"),
			flex: 1,
			renderCell: ({ row: user }) => {
				return (
					<DeleteButton
						userId={user.id}
						disabled={user.id === currentUser?.id}
					/>
				);
			},
		},
	];

	return (
		<Box>
			<AdminGrid
				infiniteQuery={API.getUsers}
				columns={columns.map((column) => ({
					...column,
					headerAlign: column.field === "name" ? "left" : "center",
					align: column.field === "name" ? "left" : "center",
				}))}
			/>
		</Box>
	);
};

export default UsersSettings;
