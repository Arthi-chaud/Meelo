import {
	Box, Paper, Slide
} from "@mui/material";
import {
	LegacyRef, useEffect, useRef, useState
} from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../api/api";
import {
	playPreviousTrack, playTracks, skipTrack
} from "../../state/playerSlice";
import { RootState } from "../../state/store";
import { ExpandedPlayerControls, MinimizedPlayerControls } from "./controls";
import { DefaultWindowTitle } from "../../utils/constants";

const Player = () => {
	const userIsAuthentified = useSelector(
		(state: RootState) => state.user.user !== undefined
	);
	const cursor = useSelector((state: RootState) => state.player.cursor);
	const currentTrack = useSelector((state: RootState) => state.player.playlist[cursor]);
	const playlist = useSelector((state: RootState) => state.player.playlist);
	const player = useRef<HTMLAudioElement | HTMLVideoElement>();
	const audioPlayer = useRef<HTMLAudioElement>(typeof Audio !== "undefined" ? new Audio() : null);
	const videoPlayer = useRef<HTMLVideoElement>();
	const interval = useRef<NodeJS.Timer>();
	const dispatch = useDispatch();
	const [progress, setProgress] = useState<number | undefined>();
	const [playing, setPlaying] = useState<boolean>();
	const [illustrationURL, setIllustrationURL] = useState<string | null>();
	const playerComponentRef = useRef<HTMLDivElement>(null);
	const [expanded, setExpanded] = useState(false);
	const [windowFocused, setWindowFocused] = useState(true);
	const [notification, setNotification] = useState<Notification>();

	const play = () => {
		// Do nothing if empty playlist
		if (playlist.length == 0) {
			return;
		}
		// If playlist but cursor to -1
		if (currentTrack == undefined) {
			dispatch(skipTrack());
		}
		setPlaying(true);
		player.current?.play();
	};
	const pause = () => {
		setPlaying(false);
		player.current?.pause();
	};
	const onSkipTrack = () => {
		// If last track, disable player
		if (cursor >= playlist.length - 1) {
			pause();
		}
		dispatch(skipTrack());
	};
	const onRewind = () => {
		if (progress && progress > 5 && player.current) {
			player.current.currentTime = 0;
			return;
		}
		// If first track, disable player
		if (cursor == 0) {
			pause();
		}
		dispatch(playPreviousTrack());
	};

	useEffect(() => {
		const onFocus = () => setWindowFocused(true);
		const onBlur = () => setWindowFocused(false);

		window.addEventListener("focus", onFocus);
		window.addEventListener("blur", onBlur);
		return () => {
			window.removeEventListener("focus", onFocus);
			window.removeEventListener("blur", onBlur);
		};
	}, []);
	useEffect(() => {
		if (!userIsAuthentified) {
			pause();
			dispatch(playTracks({ tracks: [] }));
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userIsAuthentified]);
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
			notification?.close();
			document.title = `${currentTrack.track.name} - ${DefaultWindowTitle}`;
			const newIllustrationURL = currentTrack.track.illustration
				?? currentTrack.release.illustration;

			setIllustrationURL(newIllustrationURL);
			const streamURL = API.getStreamURL(currentTrack.track.stream);

			if (currentTrack.track.type == 'Audio') {
				player.current = audioPlayer.current ?? undefined;
			} else {
				player.current = videoPlayer.current;
			}
			player.current!.src = streamURL;
			player.current!.play().then(() => setPlaying(true));
			navigator.mediaSession.metadata = new MediaMetadata({
				title: currentTrack.track.name,
				artist: currentTrack.artist.name,
				album: currentTrack.release.name,
				artwork: newIllustrationURL
					? [{ src: API.getIllustrationURL(newIllustrationURL) }]
					: undefined
			});
			interval.current = setInterval(() => {
				if (player.current?.paused) {
					setPlaying(false);
				} else {
					setPlaying(true);
				}
				if (player.current?.ended) {
					API.setSongAsPlayed(currentTrack.track.songId);
					dispatch(skipTrack());
				} else {
					setProgress(player.current?.currentTime);
				}
			}, 100);
			if (!windowFocused && Notification.permission == 'granted') {
				try {
					setNotification(new Notification(`${currentTrack.track.name} - ${currentTrack.artist.name}`, {
						icon: newIllustrationURL ? API.getIllustrationURL(newIllustrationURL) : '/icon.png'
					}));
				// eslint-disable-next-line no-empty
				} catch {}
			}
		} else {
			document.title = DefaultWindowTitle;
			if (player.current) {
				player.current.src = '';
			}
			setIllustrationURL(null);
		}
		return () => clearInterval(interval.current);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentTrack]);
	useEffect(() => {
		// To avoid background scoll
		if (expanded) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [expanded]);
	return <>
		<Box sx={{ height: playerComponentRef.current?.offsetHeight }}/>
		<Slide
			style={{ position: 'fixed', bottom: 0, left: 0 }}
			direction="up"
			mountOnEnter unmountOnExit
			in={playlist.length != 0 || player.current != undefined}
		>
			<Box sx={{ padding: 2, zIndex: 'modal', width: '100%' }}>
				<Paper
					ref={playerComponentRef} elevation={20}
					sx={{
						borderRadius: '0.5', padding: { xs: 1, sm: 2 },
						display: 'flex', width: '100%', height: 'fit-content'
					}}
				>
					<MinimizedPlayerControls
						expanded={expanded}
						illustration={illustrationURL}
						track={currentTrack?.track}
						artist={currentTrack?.artist}
						release={currentTrack?.release}
						playing={playing ?? false}
						onPause={pause}
						onPlay={play}
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
				<Paper elevation={20} sx={{
					borderRadius: '0.5', padding: { xs: 1, sm: 2 }, display: 'flex',
					width: '100%', height: '100%', overflowY: 'scroll', overflowX: 'clip'
				}}>
					<ExpandedPlayerControls
						expanded={expanded}
						illustration={illustrationURL}
						track={currentTrack?.track}
						artist={currentTrack?.artist}
						release={currentTrack?.release}
						playing={playing ?? false}
						onPause={pause}
						onPlay={play}
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
	</>;
};

export default Player;
