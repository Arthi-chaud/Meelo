import { FastForward, FastRewind, Pause, PlayArrow } from "@mui/icons-material";
import { Typography, Grid, Slider, Box, IconButton, ButtonBase, CardActionArea, useTheme, Accordion, AccordionDetails, AccordionSummary, Divider } from "@mui/material";
import formatDuration from "../../utils/formatDuration";
import Illustration from "../illustration";
import LoadingComponent, { WideLoadingComponent } from "../loading/loading";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from "react";
import PlayerButtonControls from "./controls/buttons";
import PlayerSlider from "./controls/slider";
import PlayerText from "./controls/text";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import API from '../../api';
import { useQuery } from "react-query";
import { prepareMeeloQuery } from "../../query";
import LyricsBox from "./controls/lyrics";

const lyricsQuery = (slugOrId: string | number) => ({
	key: ['song', slugOrId, 'lyrics'],
	exec: () => API.getSongLyrics(slugOrId)
});


type PlayerControlsProps =
	Parameters<typeof PlayerSlider>[number] &
	Parameters<typeof PlayerText>[number] &
	Parameters<typeof PlayerButtonControls>[number] &
	{ expanded: boolean, illustration?: string | null, onExpand: (expand: boolean) => void }


const PlayerControls = (props: PlayerControlsProps) => {
	if (props.expanded === false)
		return <MinimizedPlayerControls {...props} />
	return <ExpandedPlayerControls {...props} />
}

const MinimizedPlayerControls = (props: PlayerControlsProps) => {
	const theme = useTheme();
	return <Grid container  sx={{ alignItems: 'center', justifyContent: 'space-between', padding: 1 }}>
		<Grid item xs={1.5} sm={1.25} md={0.75} lg={0.6} xl={0.5} sx={{ alignContent: 'center', marginX: 2 }}>
			<CardActionArea onClick={() => props.onExpand(true)} sx={{ borderRadius: theme.shape.borderRadius }}>
				{props.illustration
					? <Illustration url={props.illustration} fallback={<AudiotrackIcon />} />
					: <AudiotrackIcon />
				}
			</CardActionArea>
		</Grid>
		<Grid item container sx={{ flexDirection: 'column', display: 'block' }} xs>
			<PlayerText artist={props.artist} track={props.track} />
			<PlayerSlider onSlide={props.onSlide} duration={props.duration} progress={props.progress} />
		</Grid>
		<Grid item xs='auto' sx={{ display: 'flex', flexDirection: 'row' }}>
			<PlayerButtonControls {...props} />
		</Grid>
		<Grid item xs='auto'>
			<IconButton onClick={props.onStop}>
				<CloseIcon />
			</IconButton>
		</Grid>
	</Grid>
}

const ExpandedPlayerControls = (props: PlayerControlsProps) => {
	const [lyricsOpen, setLyricsOpen] = useState(true);
	const lyrics = useQuery(prepareMeeloQuery(lyricsQuery, props.track?.songId));
	return <Box sx={{ width: '100%', height: '100%' }}>
		<Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: 2 }}>
			<IconButton onClick={() => props.onExpand(false)}>
				<CloseIcon />
			</IconButton>
		</Box>
		<Grid container direction='column' sx={{ height: '80vh', width: 'inherit', justifyContent: 'space-evenly', alignItems: 'center' }}>
			<Grid item xs={4} sm sx={{ aspectRatio: '1', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
				{props.illustration
					? <Illustration url={props.illustration} fallback={<AudiotrackIcon />} />
					: <Box sx={{ height: '100%', display: 'flex', alignItems: 'center'}}>
						<AudiotrackIcon />
					</Box>
				}
			</Grid>
			<Grid item xs={4} container spacing={2} direction="column" sx={{ width: 'inherit', height: '100%', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
				<Grid item>
					<PlayerText artist={props.artist} track={props.track} />
				</Grid>
				<Grid item>
					<PlayerButtonControls {...props} />
				</Grid>
				<Grid item sx={{ width: '90%' }}>
					<PlayerSlider onSlide={props.onSlide} duration={props.duration} progress={props.progress} />
				</Grid>
			</Grid>
		</Grid>
		<Divider variant="middle"/>
		{ props.track && <Box sx={{ paddingX: 4, paddingBottom: 2 }}>
			<Accordion style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none',backgroundImage: 'none' }} expanded={lyricsOpen} onChange={() => setLyricsOpen(!lyricsOpen)}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography variant="h6" sx={{ fontWeight: 'bold' }}>Lyrics</Typography>
				</AccordionSummary>
				<AccordionDetails>
					{ lyrics.isLoading
						? <WideLoadingComponent/>
						: <LyricsBox lyrics={lyrics.data} songName={props.track.name}/>
					}
				</AccordionDetails>
			</Accordion>
		</Box>
		}
	</Box>
}


export default PlayerControls;