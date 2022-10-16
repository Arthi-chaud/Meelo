import { Grid, Box, List, Collapse, Button, IconButton, Typography, useTheme, Divider, Tooltip } from "@mui/material"
import FadeIn from "react-fade-in"
import API from "../../api"
import InfiniteList from "../infinite/infinite-list"
import { TrackWithRelease } from "../../models/track"
import { WideLoadingComponent } from "../loading/loading"
import Illustration from '../illustration';
import Link from 'next/link';
import ListItem from "./item";
import { Page } from "../infinite/infinite-scroll"
import ListItemButton from "./item-button"
import { AlbumWithArtist } from "../../models/album"
import Release from "../../models/release"
import { Star } from "@mui/icons-material"
import { Album } from "@mui/icons-material"
import LoadingItemComponent from "../loading/loading-item"
import AlbumContextualMenu from "../contextual-menu/album-contextual-menu"

type AlbumItemProps = {
	album: AlbumWithArtist;
}

/**
 * Item for a list of albums
 * @param props 
 * @returns 
 */
const AlbumItem = ({ album }: AlbumItemProps) => {
	const artist = album.artist;
	return (
		<ListItem
			icon={<Illustration url={album.illustration} fallback={<Album/>}/>}
			href={`/albums/${artist?.slug ?? 'compilations'}+${album.slug}`}
			title={album.name}
			secondTitle={ artist?.name ?? 'Compilations'}
			trailing={<AlbumContextualMenu album={album} />}
		/>
	)
}

export default AlbumItem;