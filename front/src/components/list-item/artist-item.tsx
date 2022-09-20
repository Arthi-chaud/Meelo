import { Grid, Box, List, Collapse, Button, IconButton, Typography, useTheme, Divider } from "@mui/material"
import FadeIn from "react-fade-in"
import API from "../../api"
import Artist from "../../models/artist"
import InfiniteList from "../infinite/infinite-list"
import { TrackWithRelease } from "../../models/track"
import { WideLoadingComponent } from "../loading/loading"
import Illustration from '../illustration';
import Link from 'next/link';
import ListItem from "./item";
import { Page } from "../infinite/infinite-scroll"
import ListItemButton from "./item-button"
import Album, { AlbumWithArtist } from "../../models/album"
import Release from "../../models/release"
import AccountCircle from "@mui/icons-material/AccountCircle"
import AlbumIcon from "@mui/icons-material/Album"

type ArtistItemProps = {
	artist: Artist;
}

/**
 * Item for a list of albums
 * @param props 
 * @returns 
 */
const ArtistItem = ({ artist }: ArtistItemProps) => {
	return (
		<ListItem
			icon={<Illustration url={artist.illustration} fallback={<AccountCircle/>}/>}
			title={<Typography>{artist.name}</Typography>}
			expanded={() => (
				<InfiniteList
					firstLoader={() => <WideLoadingComponent/>}
					loader={() => <WideLoadingComponent/>}
					query={() => ({
						key: ['artist', artist.id, 'albums'],
						exec: (lastPage: Page<Album>) => API.getArtistAlbums(
							artist.id,
							lastPage,
							{  sortBy: 'releaseDate', order: 'asc'}
						)
					})}
					render={(album: Album) => <>
						<ListItem
							icon={<Illustration url={album.illustration} fallback={<AlbumIcon/>}/>}
							title={
								<ListItemButton
									url={`/albums/${artist.slug}+${album.slug}`}
									label={album.name}
								/>
							}
							secondTitle={
								<Typography>
									{ album.releaseDate ? new Date(album.releaseDate).getFullYear() : ''}
								</Typography>
							}
						/>
					</>}
				/>
			)}
		/>
	)
}

export default ArtistItem;