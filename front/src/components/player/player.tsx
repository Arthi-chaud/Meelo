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
	const [playing, setPlaying] = useState<boolean>();
	useEffect(() => {
		audio.current?.pause();
		clearInterval(interval.current);
		setProgress(0);
		if (currentTrack) {
			const newAudio = new Audio(API.getStreamURL(currentTrack.track.stream));
			if (playing !== false) {
				newAudio.play().then(() => setPlaying(true));
			}
			audio.current = newAudio;
			interval.current = setInterval(() => {
				if (audio.current?.ended) {
					API.setSongAsPlayed(currentTrack.track.songId);
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
		playing={playing ?? false}
		onPause={() => {
			setPlaying(false);
			audio.current?.pause();
		}}
		onPlay={() => {
			setPlaying(true);
			audio.current?.play();
		}}
		duration={currentTrack?.track.duration}
		progress={progress}
		onSkipTrack={() => {}}
		onRewind={() => {}}
		onScroll={(newProgress) => audio.current?.fastSeek(newProgress)}
	/>
}

export default Player;