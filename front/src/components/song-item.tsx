import { ListItem, ListItemIcon, ListItemText, List, Collapse, ListItemButton } from "@mui/material"
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
		<ListItemButton onClick={() => setOpen(!open) }>
			<ListItemIcon>
				<img src={API.getIllustrationURL(song.illustration)} style={{ maxHeight: 30  }}/>
			</ListItemIcon>
			<ListItemText>{song.name}</ListItemText>
			<ListItemText>{artist.name}</ListItemText>
			{open ? <ExpandLess /> : <ExpandMore />}
		</ListItemButton>
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
    				<List component="div">
					{ tracks.map((track) =>
						<ListItem>
							<ListItemIcon>
								<img src={API.getIllustrationURL(track.illustration)} style={{ maxHeight: 30  }}/>
							</ListItemIcon>
							<ListItemText>{track.displayName}</ListItemText>
							<ListItemText>{track.release.title}</ListItemText>
						</ListItem>
					)}
        			</List>
				}
				/>
			}
    	</Collapse>
	</>
}

export default SongItem;