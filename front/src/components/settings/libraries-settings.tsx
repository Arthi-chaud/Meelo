import {
	CleaningServices, Delete, Refresh
} from "@mui/icons-material";
import {
	Button, Divider, Grid, IconButton, ListItem, Typography
} from "@mui/material";
import API from "../../api/api";
import Library from "../../models/library";
import InfiniteList from "../infinite/infinite-list";
import LoadingComponent, { WideLoadingComponent } from "../loading/loading";

const librariesQuery = () => ({
	key: ['libraries'],
	exec: () => API.getAllLibraries()
});

const gridItemStyle = {
	display: 'flex',
	justifyContent: 'center',
	textAlign: 'center'
};

const LibrariesSettings = () => {
	return <>
		<Grid container spacing={2} justifyContent='center'>
			<Grid item xs='auto'>
				<Button variant='outlined' color='secondary' startIcon={<CleaningServices/>}>
					Clean All
				</Button>
			</Grid>
			<Grid item xs='auto'>
				<Button variant='contained' color='secondary' startIcon={<Refresh/>}>
					Scan All
				</Button>
			</Grid>
		</Grid>
		<Divider sx={{ paddingY: 2 }}/>
		<InfiniteList
			query={librariesQuery}
			firstLoader={() => <WideLoadingComponent/>}
			loader={() => <LoadingComponent/>}
			render={(library: Library) => <ListItem>
				<Grid container>
					<Grid item xs={7}>
						<Typography>{library.name}</Typography>
					</Grid>
					<Grid item xs={2} sx={gridItemStyle}>
						<Button variant='outlined' color='secondary' startIcon={<CleaningServices/>}>
							Clean
						</Button>
					</Grid>
					<Grid item xs={2} sx={gridItemStyle}>
						<Button variant='contained' color='secondary' startIcon={<Refresh/>}>
							Scan
						</Button>
					</Grid>
					<Grid item xs={1} sx={gridItemStyle}>
						<IconButton color='error'>
							<Delete/>
						</IconButton>
					</Grid>
				</Grid>
			</ListItem>}
		/>
	</>;
};

export default LibrariesSettings;
