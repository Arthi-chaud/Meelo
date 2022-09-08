import { ListItem, Grid, ListItemText, List, Collapse, Button, IconButton, Typography } from "@mui/material"
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
import Link from 'next/link';
import AspectRatio from '@mui/joy/AspectRatio'

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
		<Grid container padding={2}>
			<Grid item xs={5}>
				<Typography>{song.name}</Typography>
			</Grid>
			<Grid item xs={6}>
				<Link href={`/artists/${artist.slug}`}>
					<Button variant="text" color='inherit' sx={{ textTransform: 'none' }}>
						<Typography>{artist.name}</Typography>
					</Button>
				</Link>
			</Grid>
			<Grid item container  sx={{ justifyContent: 'center' }} xs={1}>
				<IconButton onClick={() => setOpen(!open) }>
					{open ? <ExpandLess /> : <ExpandMore />}
				</IconButton>
			</Grid>
		</Grid>
		<Collapse in={open} timeout="auto" unmountOnExit>
			{ open && <InfiniteList
				firstLoader={() => <WideLoadingComponent/>}
				loader={() => <WideLoadingComponent/>}
				queryKey={['tracks', 'song', song.id.toString()]}
				fetch={(lastPage, pageSize) => API.getSongTracks(
					song.id,
					{ index: lastPage?.index, pageSize: pageSize },
					['release']
				) as unknown as Promise<PaginatedResponse<TrackWithRelease>>}
				render={(tracks: TrackWithRelease[]) =>
    				<List sx={{ paddingX: 2 }}>
					{ tracks.map((track) =>
						<FadeIn>
							<Grid container padding={2}>
								<Grid item xs={6}>
									<Typography>{track.displayName}</Typography>
								</Grid>
								<Grid item xs={6}>
									<Link href={`/releases/${track.release.id}`}>
										<Button variant="text" color='inherit' sx={{ textTransform: 'none' }}>
											<Typography>{track.release.title}</Typography>
										</Button>
									</Link>
								</Grid>
							</Grid>
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