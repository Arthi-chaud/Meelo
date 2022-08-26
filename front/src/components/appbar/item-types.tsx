import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import AlbumIcon from '@mui/icons-material/Album';
/**
 * Array of possible item types
 */
const itemType = ['artists', 'albums', 'songs'] as const;
const formattedItemTypes = itemType.map((type) => type.charAt(0).toUpperCase() + type.slice(1));
const getTypeIcon = (type: typeof itemType[number]) => {
	switch (type) {
		case 'albums':
			return <AlbumIcon/>
		case 'artists':
			return <AccountCircleIcon/>
		case 'songs':
			return <AudiotrackIcon/>
	}
}

export { itemType, formattedItemTypes, getTypeIcon };