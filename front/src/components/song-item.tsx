import { ListItem, ListItemIcon, ListItemText, List, Collapse, ListItemButton, IconButton, Link } from "@mui/material"
import { useState } from "react"
import FadeIn from "react-fade-in"
import { useQuery } from "react-query"
import API from "../api"
import Song, { SongWithArtist } from "../models/song"
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import InfiniteList from "./infinite/infinite-list"
import { TrackWithRelease } from "../models/track"
import { PaginatedResponse } from "../models/pagination"
import { WideLoadingComponent } from "./loading/loading"
import Illustration from './illustration';

type SongItemProps = {
	song: SongWithArtist;
}
/**
 * Item for a list of songs
 * @param props 
 * @returns 
 */
const SongItem = (props: SongItemProps) => {
	const song = props.song;
	const artist = props.song.artist;
	const [open, setOpen] = useState(false);
	return <>
		<ListItem>
			<ListItemText>{song.name}</ListItemText>
			<ListItemText>
				<Link href={`/artists/${artist.slug}`}>
					{artist.name}
				</Link>
			</ListItemText>
			<IconButton onClick={() => setOpen(!open) }>
				{open ? <ExpandLess /> : <ExpandMore />}
			</IconButton>
		</ListItem>
		<Collapse in={open} timeout="auto" unmountOnExit>
			{ open && <InfiniteList
				firstLoader={() => <WideLoadingComponent/>}
				loader={() => <WideLoadingComponent/>}
				queryKey={['tracks', 'song', song.id]}
				fetch={(lastPage, pageSize) => API.getSongTracks(
					song.id,
					{ index: lastPage?.index, pageSize: pageSize },
					['release']
				) as unknown as Promise<PaginatedResponse<TrackWithRelease>>}
				render={(tracks: TrackWithRelease[]) =>
    				<List sx={{ paddingX: 2 }}>
					{ tracks.map((track) =>
						<FadeIn>
							<ListItem>
								<ListItemText>{track.displayName}</ListItemText>
								<ListItemText>
									<Link href={`/releases/${track.release.id}`}>
										{track.release.title}
									</Link>
								</ListItemText>
							</ListItem>
						</FadeIn>
					)}
        			</List>
				}
				/>
			}
    	</Collapse>
	</>
}

export default SongItem;