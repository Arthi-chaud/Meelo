import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PauseIcon, PlayIcon } from "@/ui/icons";
import { isPlayingAtom, pauseAtom, playAtom } from "~/components/player/state";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";

export const PlaybackControls = () => {
	const isPlaying = useAtomValue(isPlayingAtom);
	const play = useSetAtom(playAtom);
	const pause = useSetAtom(pauseAtom);
	const onPress = useCallback(() => {
		isPlaying ? pause() : play();
	}, [isPlaying, play, pause]);

	return (
		<View style={[styles.root]}>
			<Pressable onPress={onPress}>
				<Icon
					icon={isPlaying ? PauseIcon : PlayIcon}
					style={{ color: "white", size: 36 }} // TODO hardcoded size
					variant="Bold"
				/>
			</Pressable>
		</View>
	);
};

const styles = StyleSheet.create(() => ({
	root: { flexDirection: "row", justifyContent: "space-evenly" },
}));
