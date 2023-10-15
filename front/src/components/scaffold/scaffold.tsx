/* eslint-disable quote-props */
import {
	Box,
	Divider,
	List, ListItem, ListItemButton, ListItemIcon,
	ListItemText, Drawer as MUIDrawer, Typography, useTheme
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

/**
 * Array of possible item types
 */
const itemType = [
	'artists',
	'albums',
	'songs',
	'videos',
	'playlists'
] as const;
const getTypeIcon = (type: typeof itemType[number], props?: IconProps) => {
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

const Drawer = () => {
	const router = useRouter();
	const theme = useTheme();
	const persistentDrawerBreakpoint = 'md' as const;
	const drawerWidth = { [persistentDrawerBreakpoint]: 240 };
	const itemTextDisplay = { xs: 'none', [persistentDrawerBreakpoint]: 'initial' };
	const [drawerIsOpen, openDrawer] = useState(false);

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
			justifyContent: 'center',
			alignItems: 'center', padding: 2,
			display: { xs: 'none', [persistentDrawerBreakpoint]: 'flex' }
		}}>
			<Link href="/" style={{ cursor: 'pointer' }}>
				<Image src="/banner.png" alt="icon" priority width={180} height={75}/>
			</Link>
		</Box>
		<Divider/>
		<List>
			{itemType.map((item) => {
				const path = `/${item}`;
				const isSelected = path == router.asPath;
				const Icon = (props: IconProps) => getTypeIcon(item, props);

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
	</MUIDrawer>;
};

const Scaffold = (props: { children: any }) => {
	return <Box sx={{ display: 'flex', width: '100%' }}>
		<Drawer/>
		<Box sx={{ display: 'flex', flexDirection: 'column', overflowX: 'clip', width: '100%' }}>
			{props.children}
			<Box sx={{ height: '100%' }} />
			<Player/>
		</Box>
	</Box>;
};

export default Scaffold;
