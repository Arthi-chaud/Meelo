import {
	Box,
	Checkbox,
	IconButton, Typography
} from "@mui/material";
import API from "../../api/api";
import User from "../../models/user";
import DeleteIcon from '@mui/icons-material/Delete';
import { useSelector } from "react-redux";
import { RootState } from "../../state/store";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { useConfirm } from "material-ui-confirm";
import { GridColDef } from '@mui/x-data-grid';
import AdminGrid from "../admin-grid";

const DeleteButton = ({ userId, disabled }: { userId: number, disabled: boolean }) => {
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const userDeletionMutation = useMutation(() =>
		API.deleteUser(userId)
			.catch(() => toast.error("User deletion failed, try again"))
			.then(() => {
				toast.success("User deleted successfully");
				queryClient.invalidateQueries();
			}));

	return <IconButton color="error"
		disabled={disabled}
		onClick={() => confirm({
			title: 'Warning',
			description: 'You are about to delete a user. This can not be undone.',
			confirmationText: 'Delete User',
			confirmationButtonProps: {
				variant: 'outlined',
				color: 'error',
				onClickCapture: () => userDeletionMutation.mutate()
			}
		})}
	>
		<DeleteIcon />
	</IconButton>;
};

const UsersSettings = () => {
	const queryClient = useQueryClient();
	const currentUser = useSelector((state: RootState) => state.user.user!);
	const userMutation = useMutation((
		{ user, status }: { user: User, status: Parameters<typeof API.updateUser>[1]}
	) => API.updateUser(user.id, status)
		.catch(() => toast.error("Updating user failed, try again"))
		.then(() => {
			const toastMessages: string[] = [];

			if (status.enabled == true) {
				toastMessages.push("User is now enabled");
			} else if (status.enabled === false) {
				toastMessages.push("User is now disabled");
			}
			if (status.admin == true) {
				toastMessages.push("User is now an admin and can run administrative tasks");
			} else if (status.admin === false) {
				toastMessages.push("User is not an admin anymore");
			}
			toastMessages.forEach(
				(message) => toast.success(message)
			);
			queryClient.invalidateQueries();
		}));
	const columns: GridColDef<User>[] = [
		{ field: 'name', headerName: 'Name', flex: 7, renderCell: ({ row: user }) => {
			return <Typography display="inline-flex">
				{user.name}
				{ user.id == currentUser?.id && <Typography color='grey' paddingX={1}>(You)</Typography>}
			</Typography>;
		} },
		{ field: 'enabled', headerName: 'Enabled', flex: 2, renderCell: ({ row: user }) => {
			return <Checkbox checked={user.enabled}
				disabled={user.id == currentUser?.id}
				onChange={(event) => userMutation.mutate(
					{ user, status: { enabled: event.target.checked } }
				)}
			/>;
		} },
		{ field: 'admin', headerName: 'Admin', flex: 2, renderCell: ({ row: user }) => {
			return <Checkbox checked={user.admin}
				disabled={user.id == currentUser?.id}
				onChange={(event) => userMutation.mutate(
					{ user, status: { admin: event.target.checked } }
				)}
			/>;
		} },
		{ field: 'delete', headerName: 'Delete', flex: 1, renderCell: ({ row: user }) => {
			return <DeleteButton userId={user.id} disabled={user.id == currentUser?.id} />;
		} }
	];

	return <Box>
		<AdminGrid
			infiniteQuery={API.getUsers}
			columns={columns.map((column) => ({
				...column,
				headerAlign: column.field == 'name' ? 'left' : 'center',
				align: column.field == 'name' ? 'left' : 'center',
			}))}
		/>
	</Box>;
};

export default UsersSettings;
