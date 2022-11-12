import { BottomNavigation, Box, Button, Card, CardContent, Hidden, Paper, Slide, Typography, useTheme } from "@mui/material"
import { LegacyRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../api";
import { playNextTrack, playPreviousTrack, pushCurrentTrackToHistory, setHistoryToPlaylist } from "../../state/playerSlice";
import { RootState } from "../../state/store";
import { MinimizedPlayerControls, ExpandedPlayerControls } from "./controls";
import Link from 'next/link';
import { DefaultWindowTitle } from "../../utils/constants";

const Player = () => {
	const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
	const history = useSelector((state: RootState) => state.player.history);
	const playlist = useSelector((state: RootState) => state.player.playlist);
	const player = useRef<HTMLAudioElement | HTMLVideoElement>();
	const audioPlayer = useRef<HTMLAudioElement>(typeof Audio !== "undefined" ? new Audio() : null);
	const videoPlayer = useRef<HTMLVideoElement>();
	const interval = useRef<NodeJS.Timer>();
	const dispatch = useDispatch();
	const [progress, setProgress] = useState<number | undefined>();
	const [playing, setPlaying] = useState<boolean>();
	const [illustrationURL, setIllustrationURL] = useState<string | null>();
	const [stopped, setStopped] = useState(false);
  	const playerComponentRef = useRef<HTMLDivElement>(null);
	const [expanded, setExpanded] = useState(false);

	const play = () => {
		if (playlist.length == 0) 
			dispatch(setHistoryToPlaylist());
		if (currentTrack == undefined)
			dispatch(playNextTrack());
		setPlaying(true);
		player.current?.play();
	};
	const pause = () => {
		setPlaying(false);
		player.current?.pause();
	}
	const stop = () => {
		setStopped(true);
		player.current?.pause();
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
		player.current?.pause();
		navigator.mediaSession.metadata = null;
		clearInterval(interval.current);
		setProgress(0);
		navigator.mediaSession.setActionHandler('play', play);
		navigator.mediaSession.setActionHandler('pause', pause);
		navigator.mediaSession.setActionHandler('previoustrack', onRewind);
		navigator.mediaSession.setActionHandler('nexttrack', onSkipTrack);
		if (currentTrack) {
			document.title = `${currentTrack.track.name} - ${DefaultWindowTitle}`;
			setStopped(false);
			const newIllustrationURL = currentTrack.track.illustration ?? currentTrack.release.illustration;
			setIllustrationURL(newIllustrationURL);
			const streamURL = API.getStreamURL(currentTrack.track.stream);
			if (currentTrack.track.type == 'Audio') {
				player.current = audioPlayer.current ?? undefined;
			} else {
				player.current = videoPlayer.current
			}
			player.current!.src = streamURL;
			player.current!.play().then(() => setPlaying(true));
			navigator.mediaSession.metadata = new MediaMetadata({
				title: currentTrack.track.name,
				artist: currentTrack.artist.name,
				album: currentTrack.release.name,
				artwork: newIllustrationURL ? [
					{ src: API.getIllustrationURL(newIllustrationURL) }
				] : undefined
			  });
			interval.current = setInterval(() => {
				if (player.current?.paused)
					setPlaying(false);
				else
					setPlaying(true);
				if (player.current?.ended) {
					API.setSongAsPlayed(currentTrack.track.songId);
					dispatch(playNextTrack());
				} else {
					setProgress(player.current?.currentTime);
				}
			}, 100);
		} else {
			document.title = DefaultWindowTitle;
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
	return <>
		<Box sx={{ height: playerComponentRef.current?.offsetHeight }}/>
		<Slide
			style={{ position: 'fixed', bottom: 0, left: 0 }}
			direction="up"
			mountOnEnter unmountOnExit
			in={(playlist.length != 0 || history.length != 0 || player.current != undefined) && !stopped}
		>
			<Box sx={{ padding: 2, zIndex: 'modal', width: '100%' }}>
				<Paper ref={playerComponentRef} elevation={20} sx={{ borderRadius: '0.5', padding: { xs: 1, sm: 2 }, display: 'flex', width: '100%', height: 'fit-content' }}>
					<MinimizedPlayerControls
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
						onSlide={(newProgress) => {
							if (player.current !== undefined) {
								player.current.currentTime = newProgress;
							}
						}}
					/>
				</Paper>
			</Box>
		</Slide>
		<Slide in={expanded} style={{ position: 'fixed', bottom: 0, left: 0 }} direction="up">
			<Box sx={{ padding: 2, zIndex: 'tooltip', width: '100%', height: '100%' }}>
				<Paper elevation={20} sx={{ borderRadius: '0.5', padding: { xs: 1, sm: 2 }, display: 'flex', width: '100%', height: '100%' , overflowY: 'scroll', overflowX: 'clip' }}>
					<ExpandedPlayerControls
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
						videoRef={videoPlayer as unknown as LegacyRef<HTMLVideoElement>}
						onSlide={(newProgress) => {
							if (player.current !== undefined) {
								player.current.currentTime = newProgress;
							}
						}}
					/>
				</Paper>
			</Box>
		</Slide>
	</>
}

export default Player;
