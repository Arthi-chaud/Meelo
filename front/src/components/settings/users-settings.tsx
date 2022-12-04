import {
	Box, Checkbox, Grid,
	IconButton, ListItem, Typography
} from "@mui/material";
import API from "../../api/api";
import User, { UserSortingKeys } from "../../models/user";
import { SortingParameters } from "../../utils/sorting";
import { Page } from "../infinite/infinite-scroll";
import InfiniteList from "../infinite/infinite-list";
import { WideLoadingComponent } from "../loading/loading";
import LoadingPage from "../loading/loading-page";
import DeleteIcon from '@mui/icons-material/Delete';
import { useSelector } from "react-redux";
import { RootState } from "../../state/store";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { useConfirm } from "material-ui-confirm";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useInfiniteQuery } from "../../api/use-query";
import { useEffect, useState } from "react";

const usersQuery = (sort?: SortingParameters<typeof UserSortingKeys>) => ({
	key: ['users', sort ?? {}],
	exec: (lastPage: Page<User>) => API.getUsers(lastPage, sort)
});

const DeleteButton = ({ userId, disabled }: { userId: number, disabled: boolean }) => {
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const userDeletionMutation = useMutation(() =>
		API.deleteUser(userId)
			.catch(() => toast.error("User deletion failed, try again"))
			.then(() => {
				toast.success("User deleted successfully", { duration: 2000 });
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
	const users = useInfiniteQuery(usersQuery);
	const [currentPage, setCurrentPage] = useState(0);
	const [itemsCount, setItemsCount] = useState(0);
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
				(message) => toast.success(message, { duration: 2000 })
			);
			queryClient.invalidateQueries();
		}));
	const columns: GridColDef<User>[] = [
		{ field: 'name', headerName: 'Name', flex: 7, renderCell: ({ row: user }) => {
			return <Typography display="inline-flex">
				{user.name}
				{ user.id == currentUser?.id && <Typography color='grey' paddingX={1}>(You)</Typography>}
			</Typography>
		} },
		{ field: 'enabled', headerName: 'Enabled', flex: 2, renderCell: ({ row: user }) => {
			return <Checkbox checked={user.enabled} color='secondary'
				disabled={user.id == currentUser?.id}
				onChange={(event) => userMutation.mutate(
					{ user, status: { enabled: event.target.checked } }
				)}
			/>;
		} },
		{ field: 'admin', headerName: 'Admin', flex: 2, renderCell: ({ row: user }) => {
			return <Checkbox checked={user.admin} color='secondary'
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

	useEffect(() => {
		setItemsCount(users.data?.pages
			.map((page) => page.items.length)
			.reduce((pageSize, sum) => pageSize + sum, 0) ?? 0);
		users.hasNextPage && users.fetchNextPage()
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [users.data?.pages]);

	return <Box sx={{ paddingBottom: 2 }}>
		<DataGrid
			loading={users.data?.pages[currentPage] == undefined}
			rows={users.data?.pages[currentPage]?.items ?? []}
			rowCount={itemsCount}
			pageSize={API.defaultPageSize}
			page={currentPage}
			disableColumnSelector
			disableColumnMenu
			disableSelectionOnClick
			paginationMode='server'
			autoHeight
			onPageChange={(page) => {
				if (page == currentPage + 1) {
					users.fetchNextPage();
				} else if (page == currentPage - 1){
					users.fetchPreviousPage();
				}
				setCurrentPage(page);
			}}
			columns={columns.map((column) => ({
				...column,
				sortable: false,
				headerAlign: column.field == 'name' ? 'left' : 'center',
				align: column.field == 'name' ? 'left' : 'center',
			}))}
		/>
	</Box>;
};

export default UsersSettings;
