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

const girdItemStyle = {
	display: 'flex',
	justifyContent: 'center',
	textAlign: 'center'
};

const usersQuery = (sort?: SortingParameters<typeof UserSortingKeys>) => ({
	key: ['users', sort ?? {}],
	exec: (lastPage: Page<User>) => API.getUsers(lastPage, sort)
});

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
				<ListItem>
					<Grid container item sx={{ justifyContent: 'center', alignItems: 'center' }}>
						<Grid item xs={7} sx={{ display: 'inline-flex' }}>
							<Typography>
								{user.name}
							</Typography>
							{ user.id == currentUser.id && <Typography color='gray' sx={{ paddingX: 1 }}>
								{"(You)"}
							</Typography> }
						</Grid>
						<Grid item xs={2} sx={girdItemStyle}>
							<Checkbox checked={user.enabled} color='secondary'
								disabled={user.id == currentUser.id}
							/>
						</Grid>
						<Grid item xs={2} sx={girdItemStyle}>
							<Checkbox checked={user.admin} color='secondary'
								disabled={user.id == currentUser.id}
							/>
						</Grid>
						<Grid item xs={1} sx={girdItemStyle}>
							<IconButton color="error"
								disabled={user.id == currentUser.id}
							>
								<DeleteIcon />
							</IconButton>
						</Grid>
					</Grid>
				</ListItem>
			}
		/>
	</>;
};

export default UsersSettings;
