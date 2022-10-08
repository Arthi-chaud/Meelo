import { FastForward, FastRewind, Pause, PlayArrow } from "@mui/icons-material";
import { Typography, Grid, Slider, Box, IconButton, ButtonBase, CardActionArea, useTheme } from "@mui/material";
import formatDuration from "../../utils/formatDuration";
import Illustration from "../illustration";
import LoadingComponent from "../loading/loading";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from "react";
import PlayerButtonControls from "./controls/buttons";
import PlayerSlider from "./controls/slider";
import PlayerText from "./controls/text";

type PlayerControlsProps = 
	Parameters<typeof PlayerSlider>[number] &
	Parameters<typeof PlayerText>[number] &
	Parameters<typeof PlayerButtonControls>[number] & 
	{ expanded: boolean, illustration?: string | null, onExpand: (expand: boolean) => void }


const PlayerControls = (props: PlayerControlsProps) => {
	if (props.expanded === false)
		return <MinimizedPlayerControls {...props}/>
	return <ExpandedPlayerControls {...props}/>
}

const MinimizedPlayerControls = (props: PlayerControlsProps) => {
	const theme = useTheme();
	return <Grid container spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-evenly', padding: 1 }}>
		<Grid item xs={1.5} sm={1.25} md={0.75} lg={0.6} xl={0.5} sx={{ alignContent: 'center' }}>
			<CardActionArea onClick={() => props.onExpand(true)} sx={{ borderRadius: theme.shape.borderRadius }}>
				{ props.illustration
					? <Illustration url={props.illustration} fallback={<AudiotrackIcon/>}/>
					: <AudiotrackIcon/>
				}
			</CardActionArea>
		</Grid>
		<Grid item container sx={{ flexDirection: 'column'}} xs={6}>
			<PlayerText artist={props.artist} title={props.title}/>
			<PlayerSlider onSlide={props.onSlide} duration={props.duration} progress={props.progress}/>
		</Grid>
		<Grid item xs='auto'>
			<PlayerButtonControls {...props}/>
		</Grid>
		<Grid item xs='auto'>
			<IconButton onClick={props.onStop}>
				<CloseIcon/>
			</IconButton>
		</Grid>
	</Grid>
}

const ExpandedPlayerControls = (props: PlayerControlsProps) => {
	return <Grid container spacing={3} direction="column" sx={{ display: 'flex', height: '100%', padding: 2, justifyContent: 'space-between'}}>
		<Grid item xs='auto' sx={{ justifyContent: 'flex-end', width: '100%', display: 'flex'}}>
			<IconButton onClick={() => props.onExpand(false)}>
				<CloseIcon/>
			</IconButton>
		</Grid>
		<Grid item xs sx={{ justifyContent: 'center', alignContent: 'center', display: 'flex'}}>
			<Illustration url={props.illustration ?? null} fallback={<AudiotrackIcon/>}/>
		</Grid>
		<Grid item xs={3} container direction="column" sx={{ justifyContent: 'space-between', display: 'flex'}}>
			<Grid item>
				<PlayerText artist={props.artist} title={props.title}/>
			</Grid>
			<Grid item>
				<PlayerButtonControls {...props}/>
			</Grid>
			<Grid item>
				<PlayerSlider onSlide={props.onSlide} duration={props.duration} progress={props.progress}/>
			</Grid>
		</Grid>
	</Grid>
}


export default PlayerControls;