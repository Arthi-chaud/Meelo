import { BottomNavigation, Box, Button, Card, CardContent, Link, Paper, Slide, useTheme } from "@mui/material"
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../api";
import { playNextTrack, playPreviousTrack, pushCurrentTrackToHistory, setHistoryToPlaylist } from "../../state/playerSlice";
import { RootState } from "../../state/store";
import PlayerControls from "./controls"

const Player = () => {
	const theme = useTheme();
	const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
	const history = useSelector((state: RootState) => state.player.history);
	const playlist = useSelector((state: RootState) => state.player.playlist);
	const audio = useRef<HTMLAudioElement>();
	const interval = useRef<NodeJS.Timer>();
	const dispatch = useDispatch();
	const [progress, setProgress] = useState<number | undefined>();
	const [playing, setPlaying] = useState<boolean>();
	const [illustrationURL, setIllustrationURL] = useState<string | null>();
	const play = () => {
		if (currentTrack == undefined)
			dispatch(playNextTrack());
		setPlaying(true);
		audio.current?.play();
	};
	const pause = () => {
		setPlaying(false);
		audio.current?.pause();
	}
	const onSkipTrack = () => {
		dispatch(pushCurrentTrackToHistory())
		if (playlist.length == 0) {
			setPlaying(false);
			dispatch(setHistoryToPlaylist());
		} else
			dispatch(playNextTrack());
	}
	const onRewind = () => {
		if (history.length == 0)
			setPlaying(false);
		dispatch(playPreviousTrack())
	}
	useEffect(() => {
		audio.current?.pause();
		audio.current = undefined;
		navigator.mediaSession.metadata = null;
		clearInterval(interval.current);
		setProgress(0);
		navigator.mediaSession.setActionHandler('play', play);
		navigator.mediaSession.setActionHandler('pause', pause);
		navigator.mediaSession.setActionHandler('previoustrack', onRewind);
		navigator.mediaSession.setActionHandler('nexttrack', onSkipTrack);
		if (currentTrack) {
			const newIllustrationURL = currentTrack?.track.illustration ?? currentTrack?.release.illustration;
			setIllustrationURL(newIllustrationURL);
			const newAudio = new Audio(API.getStreamURL(currentTrack.track.stream));
			navigator.mediaSession.metadata = new MediaMetadata({
				title: currentTrack.track.name,
				artist: currentTrack.artist.name,
				album: currentTrack.release.name,
				artwork: newIllustrationURL ? [
				  { src: API.getIllustrationURL(newIllustrationURL) }
				] : undefined
			  });
			newAudio.play().then(() => setPlaying(true));
			audio.current = newAudio;
			interval.current = setInterval(() => {
				if (audio.current?.paused)
					setPlaying(false);
				else
					setPlaying(true);
				if (audio.current?.ended) {
					API.setSongAsPlayed(currentTrack.track.songId);
					dispatch(playNextTrack());
				} else {
					setProgress(audio.current?.currentTime);
				}
			}, 100);
		}
		return () => clearInterval(interval.current);
	}, [currentTrack]);
	if (playlist.length == 0 && history.length == 0 && audio.current == undefined)
		return <></>
	return <Slide direction="up" in={true} mountOnEnter unmountOnExit>
		<Box position='sticky'>
			<Box sx={{ height: '15vh' }}/>
			<Box sx={{ width: '100%', display: 'flex', position: 'fixed', right: 16, bottom: 16,justifyContent: 'center' }}>
				<Paper elevation={20} sx={{ width: '90%', borderRadius: '0.5rem', zIndex: 'modal' }}>
					<PlayerControls
						illustration={illustrationURL}
						title={currentTrack?.track.name}
						artist={currentTrack?.artist.name}
						playing={playing ?? false}
						onPause={pause}
						onPlay={play}
						duration={currentTrack?.track.duration}
						progress={progress}
						onSkipTrack={onSkipTrack}
						onRewind={onRewind}
						onScroll={(newProgress) => audio.current?.fastSeek(newProgress)}
					/>
				</Paper>
			</Box>
		</Box>
	</Slide>
}

export default Player;
