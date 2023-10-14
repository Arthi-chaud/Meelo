import {
	Box,
	Divider,
	List, ListItem, ListItemButton, ListItemIcon,
	ListItemText, Drawer as MUIDrawer
} from "@mui/material";
import {
	AlbumIcon, ArtistIcon, PlaylistIcon, SongIcon, VideoIcon
} from "../icons";
import Link from "next/link";
import Translate from "../../i18n/translate";
import Image from 'next/image';

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
const getTypeIcon = (type: typeof itemType[number]) => {
	switch (type) {
	case 'albums':
		return <AlbumIcon/>;
	case 'artists':
		return <ArtistIcon/>;
	case 'songs':
		return <SongIcon/>;
	case 'videos':
		return <VideoIcon/>;
	case 'playlists':
		return <PlaylistIcon/>;
	}
};

const Drawer = () => {
	return <MUIDrawer
		open
		variant="permanent"
		// From the documentation
		// keeps content from going under the drawer
		sx={{
			'width': 240,
			'flexShrink': 0,
			'& .MuiDrawer-paper': {
				width: 240,
				boxSizing: 'border-box',
			},
		}}
	>
		<Box sx={{ justifyContent: 'center', display: 'flex', alignItems: 'center', padding: 2 }}>
			<Link href="/" style={{ cursor: 'pointer' }}>
				<Image src="/banner.png" alt="icon" priority width={180} height={75}/>
			</Link>
		</Box>
		<Divider/>
		<List>
			{itemType.map((item) => (
				<ListItem key={item}>
					<Link href={`/${item}`} style={{ width: '100%' }}>
						<ListItemButton>
							<ListItemIcon>
								{getTypeIcon(item)}
							</ListItemIcon>
							<ListItemText>
								<Translate translationKey={item}/>
							</ListItemText>
						</ListItemButton>
					</Link>
				</ListItem>
			)) }
		</List>
	</MUIDrawer>;
};

const Scaffold = (props: { children: any }) => {
	return <Box sx={{ display: 'flex' }}>
		<Drawer/>
		{props.children}
	</Box>;
};

export default Scaffold;
