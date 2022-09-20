import { Grid, Box, List, Collapse, Button, IconButton, Typography, useTheme, Divider, Tooltip } from "@mui/material"
import FadeIn from "react-fade-in"
import API from "../../api"
import { SongWithArtist } from "../../models/song"
import InfiniteList from "../infinite/infinite-list"
import { TrackWithRelease } from "../../models/track"
import { WideLoadingComponent } from "../loading/loading"
import Illustration from '../illustration';
import Link from 'next/link';
import ListItem from "./item";
import { Page } from "../infinite/infinite-scroll"
import ListItemButton from "./item-button"
import { Star } from "@mui/icons-material"
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

type SongItemProps = {
	song: SongWithArtist;
}

/**
 * Item for a list of songs
 * @param props 
 * @returns 
 */
const SongItem = ({ song }: SongItemProps) => {
	const artist = song.artist;
	return (
		<ListItem
			icon={<Illustration url={song.illustration} fallback={<AudiotrackIcon/>}/>}
			title={<ListItemButton onClick={() => {}} label={song.name}/>}
			secondTitle={
				<ListItemButton url={`/artists/${artist.slug}`} label={artist.name} />
			}
			expanded={() => (
				<InfiniteList
					firstLoader={() => <WideLoadingComponent/>}
					loader={() => <WideLoadingComponent/>}
					query={() => ({
						key: ['tracks', 'song', song.id.toString()],
						exec: (lastPage: Page<TrackWithRelease>) => API.getSongTracks<TrackWithRelease>(
							song.id,
							lastPage,
							{ sortBy: 'name' },
							['release']
						)
					})}
					render={(track: TrackWithRelease) => <>
						<ListItem
							icon={<Illustration url={track.illustration} fallback={<AudiotrackIcon/>}/>}
							title={<ListItemButton onClick={() => {}} label={track.name}/>}
							secondTitle={
								<ListItemButton url={`/releases/${track.releaseId}`} label={track.release.name} />
							}
							trailing={track.master
								? <Tooltip title="Master track"><Star/></Tooltip>
								: <></>
							}
						/>
					</>}
				/>
			)}
		/>
	)
}

export default SongItem;