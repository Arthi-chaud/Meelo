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
import API from "../../api/api";
import User from "../../models/user";
import { useSelector } from "react-redux";
import { RootState } from "../../state/store";
import { useMutation } from "react-query";
import { useQueryClient } from "../../api/use-query";
import { toast } from "react-hot-toast";
import { useConfirm } from "material-ui-confirm";
import { GridColDef } from "@mui/x-data-grid";
import AdminGrid from "../admin-grid";
import Translate, { translate, useLanguage } from "../../i18n/translate";
import { useMemo } from "react";
import { DeleteIcon } from "../icons";

const DeleteButton = ({
	userId,
	disabled,
}: {
	userId: number;
	disabled: boolean;
}) => {
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const userDeletionMutation = useMutation(() =>
		API.deleteUser(userId)
			.catch(() => toast.error(translate("userDeletionFail")))
			.then(() => {
				toast.success(translate("userDeleted"));
				queryClient.client.invalidateQueries();
			}),
	);

	return (
		<IconButton
			color="error"
			disabled={disabled}
			onClick={() =>
				confirm({
					title: <Translate translationKey="warning" />,
					description: (
						<Translate translationKey="deleteUserWarning" />
					),
					confirmationText: <Translate translationKey="deleteUser" />,
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
	const currentUser = useSelector((state: RootState) => state.user.user!);
	const userMutation = useMutation(
		({
			user,
			status,
		}: {
			user: User;
			status: Parameters<typeof API.updateUser>[1];
		}) =>
			API.updateUser(user.id, status)
				.catch(() => toast.error(translate("userUpdateFail")))
				.then(() => {
					const toastMessages: string[] = [];

					if (status.enabled == true) {
						toastMessages.push(translate("userNowEnabled"));
					} else if (status.enabled === false) {
						toastMessages.push(translate("userNowDisabled"));
					}
					if (status.admin == true) {
						toastMessages.push(translate("userNowAdmin"));
					} else if (status.admin === false) {
						toastMessages.push(translate("userNowDisabled"));
					}
					toastMessages.forEach((message) => toast.success(message));
					queryClient.client.invalidateQueries();
				}),
	);
	const language = useLanguage();
	const columns: GridColDef<User>[] = useMemo(
		() => [
			{
				field: "name",
				headerName: translate("name"),
				flex: 7,
				renderCell: ({ row: user }) => {
					return (
						<Typography display="inline-flex">
							{user.name}
							{user.id == currentUser?.id && (
								<Typography color="grey" paddingX={1}>
									(<Translate translationKey="you" />)
								</Typography>
							)}
						</Typography>
					);
				},
			},
			{
				field: "enabled",
				headerName: translate("enabled"),
				flex: 2,
				renderCell: ({ row: user }) => {
					return (
						<Checkbox
							checked={user.enabled}
							disabled={user.id == currentUser?.id}
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
				headerName: translate("admin"),
				flex: 2,
				renderCell: ({ row: user }) => {
					return (
						<Checkbox
							checked={user.admin}
							disabled={user.id == currentUser?.id}
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
				headerName: translate("delete"),
				flex: 1,
				renderCell: ({ row: user }) => {
					return (
						<DeleteButton
							userId={user.id}
							disabled={user.id == currentUser?.id}
						/>
					);
				},
			},
		],
		[language],
	);

	return (
		<Box>
			<AdminGrid
				infiniteQuery={API.getUsers}
				columns={columns.map((column) => ({
					...column,
					headerAlign: column.field == "name" ? "left" : "center",
					align: column.field == "name" ? "left" : "center",
				}))}
			/>
		</Box>
	);
};

export default UsersSettings;
