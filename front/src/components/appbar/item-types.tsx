import {
	AlbumIcon, ArtistIcon, SongIcon, VideoIcon
} from '../icons';
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
		return <ArtistIcon/>;
	case 'songs':
		return <SongIcon/>;
	case 'videos':
		return <VideoIcon/>;
	}
};

export { itemType, getTypeIcon };
