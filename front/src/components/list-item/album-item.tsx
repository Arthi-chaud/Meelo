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
			icon={<Illustration url={album.illustration}/>}
			title={
				<ListItemButton
					url={`/albums/${artist?.slug ?? 'compilations'}+${album.slug}`}
					label={album.name}
				/>
			}
			secondTitle={artist?.name
				? <ListItemButton url={`/albums/${artist?.slug ?? "compilations"}+${album.slug}`} label={artist?.name} />
				: <Typography margin={1}>Compilations</Typography>
			}
			trailing={album.releaseDate ? <Typography>{new Date(album.releaseDate).getFullYear()}</Typography> : undefined}
			expanded={() => (
				<InfiniteList
					firstLoader={() => <WideLoadingComponent/>}
					loader={() => <WideLoadingComponent/>}
					query={() => ({
						key: ['album', album.id, 'releases'],
						exec: (lastPage: Page<Release>) => API.getAlbumReleases<Release>(
							album.id,
							lastPage
						)
					})}
					render={(release: Release) => <>
						<ListItem
							icon={<Illustration url={release.illustration}/>}
							title={
								<ListItemButton
									url={`/releases/${artist?.slug ?? 'compilations'}+${album.slug}+${release.slug}`}
									label={release.name}
								/>
							}
							trailing={release.master
								? <Tooltip title="Master release"><Star/></Tooltip>
								: <></>
							}
						/>
					</>}
				/>
			)}
		/>
	)
}

export default AlbumItem;