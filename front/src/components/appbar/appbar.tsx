import { AppBar, Toolbar, Typography, Box, Divider, IconButton, Grid, Link, Button, InputLabel, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Select, MenuItem } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuIcon from '@mui/icons-material/Menu';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import API from '../../api';
import LoadingComponent from '../loading/loading';
import FadeIn from 'react-fade-in';
import { formattedItemTypes, itemType } from './item-types';
import globalLibrary from './global-library';
import MeeloAppBarDrawer from './drawer';
import buildLink from './build-link';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
    select: {
        '&:before': {
            borderColor: 'white',
        },
        '&:after': {
            borderColor: 'white',
        },
        '&:not(.Mui-disabled):hover::before': {
            borderColor: 'white',
        },
    },
    icon: {
        fill: 'white',
    },
    root: {
        color: 'white',
    },
})

const MeeloAppBar = () => {
	const classes = useStyles();
	const router = useRouter();
	const [requestedLibrary, setRequestedLibrary] = useState(globalLibrary);
	useEffect(() => {}, [requestedLibrary]);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const query = useQuery('libraries', () => API.getAllLibraries(), {
		onSuccess: (data) => {
			let requestedlibrarySlug = globalLibrary.slug;
			if (router.asPath.startsWith('/libraries'))
				requestedlibrarySlug = router.asPath.split('/')[2];
			setRequestedLibrary(data.items.find((library) => library.slug === requestedlibrarySlug) ?? globalLibrary)
		}
	});
	return (
		<Box>
			<AppBar position="static" style={{ padding: 5 }} elevation={1}>
				<Toolbar>
					<IconButton
						color="inherit"
						edge="start"
						onClick={() => setDrawerOpen(true)}
						sx={{ mr: 2, display: { sm: 'none' } }}
					>
						<MenuIcon />
					</IconButton>
					<Box style={{ paddingRight: 25 }}>
						<Image src="/banner.png" alt="me" width={120} height={50}/>
					</Box>
					{
						query.isLoading
							? <LoadingComponent />
							: <><FadeIn>
								<Box sx={{ display: { xs: 'none', sm: 'flex' }, marginLeft: 1, alignItems: 'center' }} flexDirection='row'>
									<Select
										disableUnderline
										variant='standard'
        								value={requestedLibrary.name}
										sx={{ color: "primary.contrastText" }}
										inputProps={{
											classes: {
												icon: classes.icon,
												root: classes.root,
											},
										}}
										onChange={(item) => {
											const targetLibaryName = item.target.value;
											if (targetLibaryName === globalLibrary.name) {
												router.push(`/albums`);
											} else {
												const targetLibrary = query.data!.items.find((library) => library.name === targetLibaryName)!;
												router.push(`/libraries/${targetLibrary.slug}/albums`);
											}
										}}
        							>
        							  {[globalLibrary, ...query.data!.items].map((library) => (
        							    <MenuItem key={library.slug} value={library.name}>
        							    	{library.name}
        							    </MenuItem>
        							  ))}
        							</Select>
									<Divider orientation='vertical' flexItem sx={{ paddingLeft: 2 }} />
									<Grid container spacing={3} sx={{ paddingLeft: 2 }}  flexDirection='row'>
										{
											itemType.map((type, index) => (
												<Grid item key={type}>
													<Button variant="text" sx={{ color: "primary.contrastText" }} href={buildLink(type, requestedLibrary.slug)}>
														<Typography sx={{ fontWeight: router.asPath.endsWith(`/${type}`) ? 'bold' : 'normal', color: 'inherit' }}>
															{formattedItemTypes.at(index)}
														</Typography>
													</Button>
												</Grid>
											))
										}
									</Grid>
								</Box>
							</FadeIn>
								<Box sx={{ flexGrow: 1 }} />
								<FadeIn>
									<Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
										<IconButton>
											<SearchIcon />
										</IconButton>
										<Divider orientation='vertical' flexItem sx={{ marginX: 1 }} />
										<IconButton>
											<MoreVertIcon />
										</IconButton>
									</Box>
								</FadeIn></>
					}
				</Toolbar>
			</AppBar>
			<MeeloAppBarDrawer
				query={query}
				isOpen={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				requestedLibrarySlug={requestedLibrary.slug}
			/>
		</Box>
	)
}

export default MeeloAppBar;
