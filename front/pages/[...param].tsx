import { AppBar, Toolbar, Typography, Box, Divider, IconButton, Grid, Drawer, List, ListSubheader, ListItem, Link } from '@mui/material';
import type { NextPage } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { it } from 'node:test';

/**
 * Array of possible item types
 */
const itemType = ['artists', 'albums', 'songs'];

const buildLink = (itemType: string, librarySlug?: string): string => {
	let itemRoute = `/${itemType}`;
	if (librarySlug)
		itemRoute = `/libraries/${librarySlug}${itemRoute}`;
	return itemRoute;
}

const Home: NextPage = () => {
	const router = useRouter();
	const [drawerOpen, setDrawerOpen] = useState(true);
	let librarySlug: string | undefined;
	if (router.asPath.startsWith('/libraries'))
		librarySlug = router.asPath.split('/')[1];

	return (
		<Box >
			<AppBar position="static" style={{ padding: 10 }}>
				<Toolbar variant="dense">
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
					<Box sx={{ display: { xs: 'none', sm: 'flex' }, marginLeft: 1 }} flexDirection='row'>
						Library
						<Divider orientation='vertical' flexItem sx={{ paddingLeft: 3 }} />
						<Grid container spacing={4} sx={{ paddingLeft: 3 }}>
							{
								itemType.map((type) => (
									<Grid item>
										<Link href={buildLink(type, librarySlug)}>
											<Typography sx={{ fontWeight: router.asPath.endsWith(`/${type}`) ? 'bold' : 'normal', color: "white" }}>{type.toLocaleUpperCase()}</Typography>
										</Link>
									</Grid>
								)) 
							}
						</Grid>
					</Box>
					<Box sx={{ flexGrow: 1 }} />
					<Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
						<IconButton>
							<SearchIcon />
						</IconButton>
						<Divider orientation='vertical' flexItem sx={{ marginX: 2 }} />
						<IconButton>
							<MoreVertIcon />
						</IconButton>
					</Box>
				</Toolbar>
			</AppBar>
			<Drawer
				variant="temporary"
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				sx={{ display: { xs: 'block', sm: 'none' } }}
			>
				<List
					subheader={
						<ListSubheader component="div" id="nested-list-subheader">
							Libraries
						</ListSubheader>
					}
				>
					<ListItem>Library 1</ListItem>
					<ListItem>Library 2</ListItem>
					<ListItem>Library 3</ListItem>
				</List>
				<Divider/>
				<List
				>
					<ListItem>Artists</ListItem>
					<ListItem>Albums</ListItem>
					<ListItem>Songs</ListItem>
				</List>
				<Divider/>

			</Drawer>
		</Box>
	)
}

export default Home
