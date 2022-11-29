import {
	Checkbox, Divider, Grid, IconButton, ListItem, Typography
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

const girdItemStyle = {
	display: 'flex',
	justifyContent: 'center',
	textAlign: 'center'
};

const usersQuery = (sort?: SortingParameters<typeof UserSortingKeys>) => ({
	key: ['users', sort ?? {}],
	exec: (lastPage: Page<User>) => API.getUsers(lastPage, sort)
});

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
				toast.success("User updated successfully", { duration: 2000 });
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
				<IconButton color="error"
					disabled={isCurrentUser}
				>
					<DeleteIcon />
				</IconButton>
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
