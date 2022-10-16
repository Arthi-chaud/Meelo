import { AppBar, Toolbar, Typography, Box, Divider, IconButton, Grid, Button, InputLabel, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Select, MenuItem } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuIcon from '@mui/icons-material/Menu';
import { useEffect, useState } from 'react';
import { dehydrate, QueryClient, useQuery } from 'react-query';
import API from '../../api';
import LoadingComponent from '../loading/loading';
import FadeIn from 'react-fade-in';
import { formattedItemTypes, itemType } from './item-types';
import globalLibrary from './global-library';
import MeeloAppBarDrawer from './drawer';
import buildLink from './build-link';
import Link from 'next/link';
import { prepareMeeloQuery } from '../../query';
import Library from '../../models/library';
import toast from 'react-hot-toast';

const libraryQuery = () => ({
	key: ['libraries'],
	exec: () => API.getAllLibraries()
});

const MeeloAppBar = () => {
	const router = useRouter();
	const [requestedLibrary, setRequestedLibrary] = useState(globalLibrary);
	const [availableLibraries, setAvailableLibraries] = useState<Library[] | null>(null);
	const librariesQuery = useQuery({
		...prepareMeeloQuery(libraryQuery),
		useErrorBoundary: false
	});
	useEffect(() => {
		if (librariesQuery.error) {
			if (availableLibraries == null)
				toast.error("Libraries could not be loaded");
			setAvailableLibraries([]);
		} else if (librariesQuery.data) {
			let requestedlibrarySlug = globalLibrary.slug;
			if (router.asPath.startsWith('/libraries'))
				requestedlibrarySlug = router.asPath.split('/')[2];
			setRequestedLibrary(librariesQuery.data.items.find((library) => library.slug === requestedlibrarySlug) ?? globalLibrary);
			setAvailableLibraries(librariesQuery.data.items);
		}
	}, [router.asPath, librariesQuery.data, librariesQuery.error, availableLibraries]);
	const [drawerOpen, setDrawerOpen] = useState(false);
	return (
		<>
			<AppBar position="sticky" style={{ padding: 5 }} elevation={1}>
				<Toolbar>
					<IconButton
						color="inherit"
						edge="start"
						onClick={() => setDrawerOpen(true)}
						sx={{ mr: 2, display: { md: 'none' } }}
					>
						<MenuIcon />
					</IconButton>
					<Box style={{ paddingRight: 25 }}>
						<Link href="/albums" style={{ cursor: 'pointer' }}>
							<a><Image src="/banner.png" alt="icon" width={120} height={50}/></a>
						</Link>
					</Box>
					{
						availableLibraries == null
							? <LoadingComponent />
							: <><FadeIn>
								<Box sx={{ display: { xs: 'none', md: 'flex' }, marginLeft: 1, alignItems: 'center' }} flexDirection='row'>
									<Select
										disableUnderline
										variant='standard'
        								value={requestedLibrary.name}
										onChange={(item) => {
											const targetLibaryName = item.target.value;
											if (targetLibaryName === globalLibrary.name) {
												router.push(`/albums`);
											} else {
												const targetLibrary = availableLibraries.find((library) => library.name === targetLibaryName)!;
												router.push(`/libraries/${targetLibrary.slug}/albums`);
											}
										}}
        							>
        							  {[globalLibrary, ...availableLibraries].map((library) => (
        							    <MenuItem key={library.slug} value={library.name}>
        							    	{library.name}
        							    </MenuItem>
        							  ))}
        							</Select>
									<Divider orientation='vertical' flexItem sx={{ paddingLeft: 2 }} />
									<Grid container spacing={3} sx={{ paddingLeft: 2, flexWrap: 'nowrap' }}  flexDirection='row'>
										{
											itemType.map((type, index) => {
												const isSelected = router.asPath == `/${type}` || (router.asPath.endsWith(`/${type}`) && (router.asPath.startsWith('/libraries')));
												return <Grid item key={type}>
													<Button variant="text" color='inherit'>
														<Link href={buildLink(type, requestedLibrary.slug)}>
															<Typography sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
																{formattedItemTypes.at(index)}
															</Typography>
														</Link>
													</Button>
												</Grid>
											})
										}
									</Grid>
								</Box>
							</FadeIn>
							<Box sx={{ flexGrow: 1 }}/>
							<FadeIn>
								<Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
									<Link href={"/search"}>
										<IconButton>
											<SearchIcon />
										</IconButton>
									</Link>
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
				availableLibraries={availableLibraries}
				isOpen={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				requestedLibrarySlug={requestedLibrary.slug}
			/>
		</>
	)
}

export default MeeloAppBar;
