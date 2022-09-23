import { Box, Button, Link } from "@mui/material"
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../api";
import { playNextTrack } from "../../state/playerSlice";
import { RootState } from "../../state/store";
import PlayerControls from "./controls"

const Player = () => {
	const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
	const history = useSelector((state: RootState) => state.player.history);
	const audio = useRef<HTMLAudioElement>();
	const interval = useRef<NodeJS.Timer>();
	const dispatch = useDispatch();
	const [progress, setProgress] = useState<number | undefined>();
	useEffect(() => {
		audio.current?.pause();
		clearInterval(interval.current)
		if (currentTrack) {
			const newAudio = new Audio(API.getStreamURL(currentTrack.track.stream));
			newAudio.play();
			setProgress(undefined);
			audio.current = newAudio;
			interval.current = setInterval(() => {
				if (audio.current?.ended) {
					// mark song as played
					dispatch(playNextTrack());
				} else {
					setProgress(audio.current?.currentTime);
				}
			})
		}
		return () => clearInterval(interval.current);
	}, [currentTrack]);
	if (history.length == 0 && audio.current == undefined)
		return <></>
	return <PlayerControls
		title={currentTrack?.track.name}
		artist={currentTrack?.artist.name}
		playing={audio.current?.paused ?? false}
		onPause={() => audio.current?.pause()}
		onPlay={() => audio.current?.play()}
		duration={currentTrack?.track.duration}
		progress={progress}
		onSkipTrack={() => {}}
		onRewind={() => {}}
		onScroll={(newProgress) => audio.current?.fastSeek(newProgress)}
	/>
}

export default Player;