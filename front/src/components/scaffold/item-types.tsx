import {
	AlbumIcon, ArtistIcon, PlaylistIcon, SongIcon, VideoIcon
} from '../icons';
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

export { itemType, getTypeIcon };
