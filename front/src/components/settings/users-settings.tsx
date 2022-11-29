import {
	Box, Button,
	Checkbox, Divider, Grid, IconButton, ListItem, Modal, Typography, useTheme
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
import { useState } from "react";

const girdItemStyle = {
	display: 'flex',
	justifyContent: 'center',
	textAlign: 'center'
};

const usersQuery = (sort?: SortingParameters<typeof UserSortingKeys>) => ({
	key: ['users', sort ?? {}],
	exec: (lastPage: Page<User>) => API.getUsers(lastPage, sort)
});

const DeleteButton = ({ userId, disabled }: { userId: number, disabled: boolean}) => {
	const queryClient = useQueryClient();
	const userDeletionMutation = useMutation(() =>
		API.deleteUser(userId)
			.catch(() => toast.error("User deletion failed, try again"))
			.then(() => {
				toast.success("User deleted successfully", { duration: 2000 });
				queryClient.invalidateQueries();
			}));
	const [open, setOpen] = useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);
	const theme = useTheme();
	const modalStyle = {
		position: 'absolute' as const,
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		width: 400,
		bgcolor: 'background.paper',
		borderRadius: theme.shape.borderRadius,
		boxShadow: 24,
		padding: 4,
	};

	return <>
		<Modal
			open={open}
			onClose={handleClose}
		>
			<Box sx={modalStyle}>
				<Typography id="modal-modal-title" variant="h6" component="h2">
					Warning
				</Typography>
				<Typography id="modal-modal-description" sx={{ mt: 2 }}>
					You are about to delete a user. This can not be undone.
				</Typography>
				<Box sx={{ display: 'flex', justifyContent: "center", paddingTop: 2 }}>
					<Button variant="outlined" color='error'
						onClick={() => {
							userDeletionMutation.mutate();
							handleClose();
						}}
					>
						Delete User
					</Button>
				</Box>
			</Box>
		</Modal>
		<IconButton color="error"
			disabled={disabled}
			onClick={handleOpen}
		>
			<DeleteIcon />
		</IconButton>
	</>;
};

/**
 * User item in list
 * @param isCurrentUser if true, will disable action buttons
 */
const UserRow = ({ user, isCurrentUser }: { user: User, isCurrentUser: boolean }) => {
	const queryClient = useQueryClient();
	const userMutation = useMutation((status: Parameters<typeof API.updateUser>[1]) =>
		API.updateUser(user.id, status)
			.catch(() => toast.error("Updating user failed, try again"))
			.then(() => {
				const toastMessages: string[] = [];

				if (status.enabled == true) {
					toastMessages.push("User is now enabled");
				} else if (status.enabled === false){
					toastMessages.push("User is now disabled");
				}
				if (status.admin == true) {
					toastMessages.push("User is now an admin and can run administrative tasks");
				} else if (status.admin === false){
					toastMessages.push("User is not an admin anymore");
				}
				toastMessages.forEach(
					(message) => toast.success(message, { duration: 2000 })
				);
				queryClient.invalidateQueries();
			}));

	return <ListItem>
		<Grid container item sx={{ justifyContent: 'center', alignItems: 'center' }}>
			<Grid item xs={7} sx={{ display: 'inline-flex' }}>
				<Typography>
					{user.name}
				</Typography>
				{ isCurrentUser && <Typography color='gray' sx={{ paddingX: 1 }}>
					{"(You)"}
				</Typography> }
			</Grid>
			<Grid item xs={2} sx={girdItemStyle}>
				<Checkbox checked={user.enabled} color='secondary'
					disabled={isCurrentUser}
					onChange={(event) => userMutation.mutate(
						{ enabled: event.target.checked }
					)}
				/>
			</Grid>
			<Grid item xs={2} sx={girdItemStyle}>
				<Checkbox checked={user.admin} color='secondary'
					disabled={isCurrentUser}
					onChange={(event) => userMutation.mutate(
						{ admin: event.target.checked }
					)}
				/>
			</Grid>
			<Grid item xs={1} sx={girdItemStyle}>
				<DeleteButton userId={user.id} disabled={isCurrentUser}/>
			</Grid>
		</Grid>
	</ListItem>;
};

const UsersSettings = () => {
	const currentUser = useSelector((state: RootState) => state.user.user!);

	return <>
		<Grid container sx={{ paddingX: 2 }}>
			<Grid item xs={7}>
				Username
			</Grid>
			<Grid item xs={2} sx={girdItemStyle}>
				Enabled
			</Grid>
			<Grid item xs={2} sx={girdItemStyle}>
				Admin
			</Grid>
			<Grid item xs={1}/>
		</Grid>
		<Divider sx={{ paddingY: 1 }}/>
		<InfiniteList
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			query={usersQuery}
			render={(user: User) =>
				<UserRow user={user} isCurrentUser={user.id == currentUser.id}/>
			}
		/>
	</>;
};

export default UsersSettings;
