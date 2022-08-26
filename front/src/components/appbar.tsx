import { AppBar, Toolbar, Typography, Box, Divider, IconButton, Grid, Drawer, List, Collapse, ListItem, Link, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuIcon from '@mui/icons-material/Menu';
import { useEffect, useState } from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AlbumIcon from '@mui/icons-material/Album';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import SettingsIcon from '@mui/icons-material/Settings';
import { useQuery } from 'react-query';
import API from '../api';
import LoadingComponent from './loading';
import FadeIn from 'react-fade-in';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
/**
 * Array of possible item types
 */
const itemType = ['artists', 'albums', 'songs'];

const buildLink = (itemType: string, librarySlug?: string | null): string => {
	let itemRoute = `/${itemType}`;
	if (librarySlug)
		itemRoute = `/libraries/${librarySlug}${itemRoute}`;
	return itemRoute;
}

const MeeloAppBar = () => {
	const router = useRouter();
	let librarySlug: string | null = null;
	if (router.asPath.startsWith('/libraries')) {
		const { id } = router.query;
		librarySlug = (id as string);
	}
	const [selectedLibrarySlug, setSelectedLibrary] = useState(librarySlug);
	useEffect(() => setSelectedLibrary(librarySlug), [librarySlug]);
	const [drawerOpen, setDrawerOpen] = useState(true);
	const { isLoading, isError, data } = useQuery('libraries', () => API.getAllLibraries());
	return (
		<Box>
			<AppBar position="static" style={{ padding: 10 }}>
				<Toolbar>
					<IconButton
						color="inherit"
						aria-label="open drawer"
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
						isLoading
						? <LoadingComponent />
						: <><FadeIn>
							<Box sx={{ display: { xs: 'none', sm: 'flex' }, marginLeft: 1, alignItems: 'center' }} flexDirection='row'>
								{librarySlug ?? "All"}
								<Divider orientation='vertical' flexItem sx={{ paddingLeft: 3 }} />
								<Grid container spacing={4} sx={{ paddingLeft: 3 }}>
									{
										itemType.map((type) => (
											<Grid item key={type}>
												<Link href={buildLink(type, librarySlug)}>
													<Typography sx={{ fontWeight: router.asPath.endsWith(`/${type}`) ? 'bold' : 'normal', color: "white" }}>{type.toLocaleUpperCase()}</Typography>
												</Link>
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
						</FadeIn>
						</>
					}
				</Toolbar>
			</AppBar>
			<Drawer
				elevation={8}
				PaperProps={{ sx: { width: '70%' } }}
				variant="temporary"
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				sx={{ display: { xs: 'block', sm: 'none' } }}
			>
				<List>
					<ListSubheader disableSticky={false}>
						<Grid container columnSpacing={2} sx={{ flexDirection: 'row', alignItems: 'center' }}>
							<Grid item sx={{ paddingTop: 1.6 }}><LibraryMusicIcon/></Grid>
							<Grid item>Libraries</Grid>
							<Grid item sx={{ flexGrow: 1 }}/>
							{ isLoading ? <Grid item><LoadingComponent /></Grid> : <></>}
						</Grid>
					</ListSubheader>
					{
						isLoading || <FadeIn> {
								data?.items.map((library) => {
									const open = selectedLibrarySlug === library.slug;
									return (<><ListItem key={library.slug}>
										<ListItemButton onClick={() => setSelectedLibrary(open ? null : library.slug)}>
											<ListItemText>{library.title}</ListItemText>
											{open ? <ExpandLess /> : <ExpandMore />}
									  	</ListItemButton>
									</ListItem>
									<Collapse in={open} unmountOnExit>
      								  <List sx={{ pl: 4 }}>
										{ itemType.map((item) => (
											<ListItemButton>
      								    	  <ListItemIcon>
      								    	    { item === 'artists' 
													? <AccountCircleIcon/>
													: item === 'albums'
														? <AlbumIcon/>
														: <AudiotrackIcon/>
												}
      								    	  </ListItemIcon>
      								    	  <ListItemText primary={item.charAt(0).toUpperCase() + item.slice(1)} />
      								    	</ListItemButton>
										))}
      								    
      								  </List>
      								</Collapse>
									</>)
								})
							} </FadeIn>
					}
				</List>
				<Divider />
				<List>
					<ListItem disablePadding>
						<ListItemButton>
							<ListItemIcon>
								<SearchIcon />
							</ListItemIcon>
							<ListItemText>Search</ListItemText>
						</ListItemButton>
					</ListItem>
					<ListItem disablePadding>
						<ListItemButton>
							<ListItemIcon>
								<AutoModeIcon />
							</ListItemIcon>
							<ListItemText>Refresh Libraries</ListItemText>
						</ListItemButton>
					</ListItem>
					<ListItem disablePadding>
						<ListItemButton>
							<ListItemIcon>
								<SettingsIcon />
							</ListItemIcon>
							<ListItemText>Settings</ListItemText>
						</ListItemButton>
					</ListItem>
				</List>
			</Drawer>
		</Box>
	)
}

export default MeeloAppBar;
