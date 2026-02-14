import { useAtomValue, useSetAtom } from "jotai";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PauseIcon, PlayIcon } from "@/ui/icons";
import {
	isBufferingAtom,
	isPlayingAtom,
	pauseAtom,
	playAtom,
} from "~/components/player/state";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";

export const PlaybackControls = () => {
	const isPlaying = useAtomValue(isPlayingAtom);
	const play = useSetAtom(playAtom);
	const isBuffering = useAtomValue(isBufferingAtom);
	const pause = useSetAtom(pauseAtom);

	return (
		<View style={[styles.root]}>
			<Pressable
				onPress={isPlaying ? pause : play}
				disabled={isBuffering}
			>
				<Icon
					icon={isPlaying ? PauseIcon : PlayIcon}
					style={{
						color: "white",
						size: 36,
						opacity: isBuffering ? 0.8 : 1,
					}} // TODO hardcoded size
					variant="Bold"
				/>
			</Pressable>
		</View>
	);
};

const styles = StyleSheet.create(() => ({
	root: { flexDirection: "row", justifyContent: "space-evenly" },
}));
