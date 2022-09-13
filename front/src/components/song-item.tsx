import { ListItem, Grid, Box, List, Collapse, Button, IconButton, Typography, useTheme, Divider } from "@mui/material"
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
import { Star } from "@mui/icons-material"

type RowProps = {
	left?: JSX.Element,
	centerLeft: JSX.Element,
	centerRight: JSX.Element
	right?: JSX.Element,
}

const Row = (props: RowProps) => {
	const theme = useTheme();
	return (
		<Grid container padding={1} spacing={2} columns={10} sx={{ alignItems: 'center' }}>
			<Grid item xs={2} sm={1.5}  md={1} lg={0.5}>
				{props.left}
			</Grid>
			<Grid item container xs={8} sx={{ alignItems: 'center'}}>
				<Grid item xs={12} sm={9}>
					{props.centerLeft}
				</Grid>
				<Grid item xs={12} sm={3} sx={{ display: 'flex', justifyContent: 'left',   }}>
					{props.centerRight}
				</Grid>
			</Grid>
			<Grid item container sx={{ justifyContent: 'end' }} xs={1} sm={2} lg={3}>
				{props.right}
			</Grid>
		</Grid>
	)
}

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
		<Row
			left={<Illustration url={song.illustration}/>}
			centerLeft={<Typography>{song.name}</Typography>}
			centerRight={
				<Link href={`/artists/${artist.slug}`}>
					<Button variant="text" color='inherit' sx={{ textTransform: 'none', justifyContent: 'left' }}>
						<Typography>{artist.name}</Typography>
					</Button>
				</Link>
			}
			right={
				<IconButton onClick={() => setOpen(!open) }>
					{open ? <ExpandLess /> : <ExpandMore />}
				</IconButton>
			}
		/>
		<Collapse in={open} timeout="auto" unmountOnExit>
			{ open && <InfiniteList
				firstLoader={() => <WideLoadingComponent/>}
				loader={() => <WideLoadingComponent/>}
				query={() => ({
					key: ['tracks', 'song', song.id.toString()],
					exec: (lastPage) => API.getSongTracks(
						song.id,
						lastPage,
						['release']
					)
				})}
				render={(tracks: TrackWithRelease[]) => <>
					<List sx={{ }}>
					{ tracks.map((track) =>
						<FadeIn key={track.id}>
							<Row
								left={<Illustration url={track.illustration}/>}
								centerLeft={<Typography>{track.name}</Typography>}
								centerRight={
									<Link href={`/releases/${track.releaseId}`}>
										<Button variant="text" color='inherit' sx={{ textTransform: 'none', justifyContent: 'left' }}>
											<Typography>{track.release.name}</Typography>
										</Button>
									</Link>
								}
								right={track.master ? <Star color='primary'/> : undefined }
							/>
						</FadeIn>
					)}
        			</List>
				</>}
				/>
			}
    	</Collapse>
	</>
}

export default SongItem;