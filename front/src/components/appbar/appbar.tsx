import { AppBar, Toolbar, Typography, Box, Divider, IconButton, Grid, Menu, Drawer, Button, List, Collapse, FormControl, ListItem, InputLabel, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Select, MenuItem } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuIcon from '@mui/icons-material/Menu';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import API from '../../api';
import LoadingComponent from '../loading';
import FadeIn from 'react-fade-in';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Library from '../../models/library';
import { getTypeIcon, formattedItemTypes, itemType } from './item-types';
import globalLibrary from './global-library';
import MeeloAppBarDrawer from './drawer';
import buildLink from './build-link';
const MeeloAppBar = () => {
	const router = useRouter();
	const [requestedLibrary, setRequestedLibrary] = useState(globalLibrary);
	useEffect(() => {}, [requestedLibrary]);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const dropdownOpen = Boolean(anchorEl);
	const handleDropdownClick = (e: React.MouseEvent) => setAnchorEl(e.currentTarget);
	const query = useQuery('libraries', () => API.getAllLibraries(), {
		onSuccess: (data) => {
			let requestedlibrarySlug = globalLibrary.slug;
			if (router.asPath.startsWith('/libraries'))
				requestedlibrarySlug = router.asPath.split('/')[2];
			console.log(requestedlibrarySlug);
			setRequestedLibrary(data.items.find((library) => library.slug === requestedlibrarySlug) ?? globalLibrary)
		}
	});
	return (
		<Box>
			<AppBar position="static" style={{ padding: 10 }}>
				<Toolbar>
					<IconButton
						color="inherit"
						edge="start"
						onClick={() => setDrawerOpen(true)}
						sx={{ mr: 2, display: { sm: 'none' } }}
					>
						<MenuIcon />
					</IconButton>
					<Box style={{ paddingRight: 30 }}>
						<Image src="/banner.png" alt="me" width={120} height={50} />
					</Box>
					{
						query.isLoading
							? <LoadingComponent />
							: <><FadeIn>
								<Box sx={{ display: { xs: 'none', sm: 'flex' }, marginLeft: 1, alignItems: 'center' }} >
									<Button
										variant="text"
										color='inherit'
										onClick={handleDropdownClick}
										sx={{ padding: 1 }}
										endIcon={ dropdownOpen ? <ExpandLess/> : <ExpandMore/> }
									>
										{ requestedLibrary.title }
									</Button>
									{/* <Dropdown>
										{
											[globalLibrary, ...data!.items].map((library) => (
												<Dropdown.Submenu
													// isA={ library.slug === requstedlibrarySlug }
													// label={ library.title }
													// parentMenuOpen={dropdownOpen}
													// sx={{ padding: 1.5 }}
													// color='inherit'
												>{
													itemType.map((type, index) => (<>
														<Button startIcon={ getTypeIcon(type) } color='inherit' sx={{ padding: 1.5 }}>
															{ formattedItemTypes.at(index) }
														</Button>
													</>))
												}</Dropdown.Submenu>
											))
										}
									</Dropdown> */}
									<Divider orientation='vertical' flexItem sx={{ paddingLeft: 3 }} />
									<Grid container spacing={4} sx={{ paddingLeft: 3 }}>
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
										<Divider orientation='vertical' flexItem sx={{ marginX: 2 }} />
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
