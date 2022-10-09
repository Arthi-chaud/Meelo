import { BottomNavigation, Box, Button, Card, CardContent, Hidden, Link, Paper, Slide, Typography, useTheme } from "@mui/material"
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../api";
import { playNextTrack, playPreviousTrack, pushCurrentTrackToHistory, setHistoryToPlaylist } from "../../state/playerSlice";
import { RootState } from "../../state/store";
import PlayerControls from "./controls";

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
	const [stopped, setStopped] = useState(false);
	const [playerHeight, setPlayerHeight] = useState(0);
  	const playerComponentRef = useRef<HTMLDivElement>(null);
	const [expanded, setExpanded] = useState(false);

  	useEffect(() => {
  		setPlayerHeight(playerComponentRef.current?.clientHeight ?? 0)
  	}, [playerComponentRef])
	const play = () => {
		if (currentTrack == undefined)
			dispatch(playNextTrack());
		setPlaying(true);
		audio.current?.play();
	};
	const pause = () => {true
		setPlaying(false);
		audio.current?.pause();
	}
	const stop = () => {
		setStopped(true);
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
			setStopped(false);
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
		} else {
			setIllustrationURL(null);
		}
		return () => clearInterval(interval.current);
	}, [currentTrack]);
	useEffect(() => {
		// To avoid background scoll
		if (expanded)
			document.body.style.overflow = 'hidden';
		else
			document.body.style.overflow = 'unset';
		return () => { document.body.style.overflow = 'unset' };
	}, [expanded])
	return <Box>
		<Box sx={{ height: playerHeight, position: 'sticky', padding: 5 }} />
		<Slide
			direction="up"
			mountOnEnter unmountOnExit
			in={(playlist.length != 0 || history.length != 0 || audio.current != undefined) && !stopped}
		>
			<Box sx={{ width: '100%', height: expanded ? '100%' : undefined, padding: 2, display: 'flex', position: 'fixed', right: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-end', zIndex: expanded ? 'modal' : undefined }}  ref={playerComponentRef}>
				<Paper elevation={20} sx={{ borderRadius: '0.5rem', display: 'flex', width: '100%', height: expanded ? '100%' : 'fit-content', overflowY: expanded ? 'scroll' : undefined, overflowX: 'clip' }}>
					<PlayerControls
						expanded={expanded}
						illustration={illustrationURL}
						track={currentTrack?.track}
						artist={currentTrack?.artist}
						playing={playing ?? false}
						onPause={pause}
						onPlay={play}
						onStop={stop}
						onExpand={(expand) => setExpanded(expand)}
						duration={currentTrack?.track.duration}
						progress={progress}
						onSkipTrack={onSkipTrack}
						onRewind={onRewind}
						onSlide={(newProgress) => audio.current?.fastSeek(newProgress)}
					/>
				</Paper>
			</Box>
		</Slide>
	</Box>

}

export default Player;
