/* eslint-disable quote-props */
import {
	BottomNavigationAction,
	Box,
	Container,
	Divider,
	List, ListItem, ListItemButton, ListItemIcon,
	ListItemText, BottomNavigation as MUIBottomNavigation,
	Drawer as MUIDrawer, Typography, useMediaQuery, useTheme
} from "@mui/material";
import {
	AlbumIcon, ArtistIcon, BurgerIcon, PlaylistIcon, SongIcon, VideoIcon
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

const Drawer = (
	{ openBottomDrawer, onClose }: { openBottomDrawer: boolean, onClose: () => void }
) => {
	const router = useRouter();
	const theme = useTheme();
	const persistentDrawerBreakpoint = DrawerBreakpoint;
	const drawerWidth = { [persistentDrawerBreakpoint]: 240 };
	const actions = useScaffoldActions();
	const drawerIsAtBottom = useMediaQuery(theme.breakpoints.down(persistentDrawerBreakpoint));

	return <MUIDrawer
		open={drawerIsAtBottom ? openBottomDrawer : true}
		anchor={'left'}
		variant={drawerIsAtBottom ? 'temporary' : 'permanent'}
		// From the documentation
		// keeps content from going under the drawer
		onClose={onClose}
		sx={{
			width: drawerIsAtBottom ? 'auto' : drawerWidth,
			flexShrink: 0,
			zIndex: 'tooltip',
			'& .MuiDrawer-paper': {
				width: drawerWidth,
				boxSizing: 'border-box',
			},
		}}
	>
		<Box sx={{
			backgroundColor: DarkTheme.background?.paper,
			justifyContent: 'center',
			display: 'flex',
			alignItems: 'center', padding: 2
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
						<ListItemButton onClick={onClose}>
							<ListItemIcon>
								<Icon variant={isSelected ? 'Bold' : 'Outline'}/>
							</ListItemIcon>
							<ListItemText>
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
						<ListItemButton onClick={() => {
							action.onClick && action.onClick();
							onClose();
						}}>
							<ListItemIcon>
								{action.icon}
							</ListItemIcon>
							<ListItemText
								primary={
									<Typography sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
										<Translate translationKey={action.label}/>
									</Typography>
								}
							>
							</ListItemText>
						</ListItemButton>
					</Link>
				</ListItem>;
			})}
		</List>
	</MUIDrawer>;
};

const BottomNavigation = (props: { onDrawerOpen: () => void }) => {
	const router = useRouter();

	return <MUIBottomNavigation
		showLabels
		value={router.asPath}
		sx={{
			boxShadow: 10,
			zIndex: 'modal', width: '100%',
			padding: 1,
			position: 'fixed',
			justifyContent: 'space-evenly',
			bottom: 0,
			display: { xs: 'flex', [DrawerBreakpoint]: 'none' }
		}}
	>
		{primaryItems.slice(0, 3).map((item) => {
			const path = `/${item}`;
			const isSelected = path == router.asPath;
			const Icon = (pr: IconProps) => getPrimaryTypeIcon(item, pr);

			return (
				<Link key={path} href={path} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
					<BottomNavigationAction key={item}
						showLabel
						icon={<Icon variant={isSelected ? 'Bold' : 'Outline'}/>}
						label={<Translate translationKey={item}/>}
					/>
				</Link>
			);
		}) }
		<BottomNavigationAction
			showLabel
			sx={{ flex: 1 }}
			icon={<BurgerIcon/>}
			onClick={props.onDrawerOpen}
			label={<Translate translationKey={'more'}/>}
		/>
	</MUIBottomNavigation>;
};

const Scaffold = (props: { children: any }) => {
	const [tempDrawerIsOpen, openDrawer] = useState(false);

	return <Box sx={{ display: 'flex', width: '100%', height: '100vh' }}>
		<Drawer openBottomDrawer={tempDrawerIsOpen} onClose={() => openDrawer(false)}/>
		<Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', overflowX: 'clip', width: '100%' }}>
			<Container maxWidth={false} sx={{ paddingTop: 2 }}>
				{props.children}
			</Container>
			<Box sx={{ height: '100%' }} />
			<Player/>
		</Box>
		<BottomNavigation onDrawerOpen={() => {
			openDrawer(!tempDrawerIsOpen);
		}}/>
	</Box>;
};

export default Scaffold;
