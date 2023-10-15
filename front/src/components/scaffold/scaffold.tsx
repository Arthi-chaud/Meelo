/* eslint-disable quote-props */
import {
	BottomNavigationAction,
	Box,
	Divider,
	List, ListItem, ListItemButton, ListItemIcon,
	ListItemText, BottomNavigation as MUIBottomNavigation, Drawer as MUIDrawer, Typography
} from "@mui/material";
import {
	AlbumIcon, ArtistIcon, PlaylistIcon, SongIcon, VideoIcon
} from "../icons";
import Link from "next/link";
import Translate from "../../i18n/translate";
import Image from 'next/image';
import Player from "../player/player";
import { useRouter } from "next/router";
import { IconProps } from "iconsax-react";
import { useState } from "react";
import { useScaffoldActions } from "./actions";
import { DarkTheme } from "../../theme/theme";

/**
 * Array of possible item types
 */
const primaryItems = [
	'artists',
	'albums',
	'songs',
	'videos',
	'playlists'
] as const;
const getPrimaryTypeIcon = (type: typeof primaryItems[number], props?: IconProps) => {
	switch (type) {
	case 'albums':
		return <AlbumIcon {...props}/>;
	case 'artists':
		return <ArtistIcon {...props}/>;
	case 'songs':
		return <SongIcon {...props}/>;
	case 'videos':
		return <VideoIcon {...props}/>;
	case 'playlists':
		return <PlaylistIcon {...props}/>;
	}
};

export const DrawerBreakpoint = 'md' as const;

const Drawer = () => {
	const router = useRouter();
	const persistentDrawerBreakpoint = DrawerBreakpoint;
	const drawerWidth = { [persistentDrawerBreakpoint]: 240 };
	const itemTextDisplay = { xs: 'none', [persistentDrawerBreakpoint]: 'initial' };
	const [drawerIsOpen, openDrawer] = useState(false);
	const actions = useScaffoldActions();

	return <MUIDrawer
		open={drawerIsOpen}
		variant="permanent"
		// From the documentation
		// keeps content from going under the drawer
		sx={{
			display: { xs: 'none', [persistentDrawerBreakpoint]: 'initial' },
			width: drawerWidth,
			flexShrink: 0,
			'& .MuiDrawer-paper': {
				width: drawerWidth,
				boxSizing: 'border-box',
			},
		}}
	>
		<Box sx={{
			backgroundColor: DarkTheme.background?.paper,
			justifyContent: 'center',
			alignItems: 'center', padding: 2,
			display: { xs: 'none', [persistentDrawerBreakpoint]: 'flex' }
		}}>
			<Link href="/" style={{ cursor: 'pointer' }}>
				<Image src="/banner.png" alt="icon" priority width={180} height={75}/>
			</Link>
		</Box>
		<Divider variant="middle"/>
		<List>
			{primaryItems.map((item) => {
				const path = `/${item}`;
				const isSelected = path == router.asPath;
				const Icon = (props: IconProps) => getPrimaryTypeIcon(item, props);

				return <ListItem key={item} >
					<Link href={path} style={{ width: '100%' }}>
						<ListItemButton>
							<ListItemIcon>
								<Icon variant={isSelected ? 'Bold' : 'Outline'}/>
							</ListItemIcon>
							<ListItemText sx={{ display: itemTextDisplay }}>
								<Typography sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
									<Translate translationKey={item}/>
								</Typography>
							</ListItemText>
						</ListItemButton>
					</Link>
				</ListItem>;
			}) }
		</List>
		<Divider variant="middle" />
		<List>
			{actions.map((action) => {
				const path = action.href;
				const isSelected = path
					? path !== '/' ? router.asPath.startsWith(path) : false
					: false;

				return <ListItem key={action.label} >
					<Link href={action.href ?? '#'} style={{ width: '100%' }}>
						<ListItemButton onClick={action.onClick}>
							<ListItemIcon>
								{action.icon}
							</ListItemIcon>
							<ListItemText sx={{ display: itemTextDisplay }}>
								<Typography sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
									<Translate translationKey={action.label}/>
								</Typography>
							</ListItemText>
						</ListItemButton>
					</Link>
				</ListItem>;
			})}
		</List>
	</MUIDrawer>;
};

const BottomNavigation = () => {
	const router = useRouter();

	return <MUIBottomNavigation
		showLabels
		value={router.asPath}
		sx={{
			zIndex: 'modal', width: '100%',
			padding: 1,
			position: 'fixed',
			bottom: 0,
			display: { xs: 'flex', [DrawerBreakpoint]: 'none' }
		}}
	>
		{primaryItems.map((item) => {
			const path = `/${item}`;
			const isSelected = path == router.asPath;
			const Icon = (props: IconProps) => getPrimaryTypeIcon(item, props);

			return (
				<Link key={path} href={path} style={{ width: '100%', height: '100%' }}>
					<BottomNavigationAction key={item}
						showLabel
						icon={<Icon variant={isSelected ? 'Bold' : 'Outline'}/>}
						label={<Translate translationKey={item}/>}
					/>
				</Link>
			);
		}) }
	</MUIBottomNavigation>;
};

const Scaffold = (props: { children: any }) => {
	return <Box sx={{ display: 'flex', width: '100%', height: '100vh' }}>
		<Drawer/>
		<BottomNavigation/>
		<Box sx={{ display: 'flex', flexDirection: 'column', overflowX: 'clip', width: '100%' }}>
			{props.children}
			<Box sx={{ height: '100%' }} />
			<Player/>
		</Box>
	</Box>;
};

export default Scaffold;
