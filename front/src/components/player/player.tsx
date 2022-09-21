import { Box, Button, Link } from "@mui/material"
import { useState } from "react";
import Illustration from "../illustration"
import PlayerControls from "./controls"

const Player = () => {
	const [playing, setPlaying] = useState(true);
	const duration=  324;
	const [progress, setProgress] = useState(100);
	return <PlayerControls
		illustration={<Illustration url={'/illustrations/tracks/1'} fallback={<Box/>}/>}
		title="Rolling in the Deep"
		artist="Adele"
		playing={playing}
		onPause={() => setPlaying(false)}
		onPlay={() => setPlaying(true)}
		duration={duration}
		progress={progress}
		onSkipTrack={() => {}}
		onRewind={() => {}}
		onScroll={(newProgress) => setProgress(newProgress)}
	/>
}

export default Player;