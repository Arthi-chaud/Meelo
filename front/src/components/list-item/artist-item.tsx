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
import Album, { AlbumWithArtist } from "../../models/album"
import Release from "../../models/release"
import AccountCircle from "@mui/icons-material/AccountCircle"
import AlbumIcon from "@mui/icons-material/Album"
import LoadingItemComponent from "../loading/loading-item"
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu"

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
			icon={<Illustration url={artist.illustration} style={{ objectFit: 'cover' }} fallback={<AccountCircle/>}/>}
			href={`/artists/${artist.slug}`}
			title={artist.name}
			trailing={<ArtistContextualMenu artist={artist}/>}
		/>
	)
}

export default ArtistItem;