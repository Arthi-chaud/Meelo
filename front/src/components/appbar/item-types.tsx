import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import AlbumIcon from '@mui/icons-material/Album';
import { MusicVideo } from '@mui/icons-material';
/**
 * Array of possible item types
 */
const itemType = [
	'artists',
	'albums',
	'songs',
	'videos'
] as const;
const getTypeIcon = (type: typeof itemType[number]) => {
	switch (type) {
	case 'albums':
		return <AlbumIcon/>;
	case 'artists':
		return <AccountCircleIcon/>;
	case 'songs':
		return <AudiotrackIcon/>;
	case 'videos':
		return <MusicVideo/>;
	}
};

export { itemType, getTypeIcon };
