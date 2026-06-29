import { useNavigation } from "expo-router";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { emptyPlaylistAtom } from "@/state/player";
import { useQueryClient } from "~/api";
export const useResetAllTabs = () => {
	const navigation = useNavigation();

	return useCallback(() => {
		const st = navigation.getParent()?.getState();
		if (!st) {
			return;
		}

		st.routes.forEach((route: any) => {
			// https://github.com/expo/expo/blob/dfc7d35b20fc8829d42a49d6da2adb8e8f03b790/packages/expo-router/src/react-navigation/bottom-tabs/views/BottomTabView.tsx#L106
			// NOTE: It will issue a warning in dev, but it works so shrug
			navigation.dispatch({
				type: "POP_TO_TOP",
				target: route.state?.key ?? route.key,
			});
		});
	}, [navigation]);
};

export const useOnLeavingInstance = () => {
	const emptyPlaylist = useSetAtom(emptyPlaylistAtom);
	const queryClient = useQueryClient();
	const resetAllTabs = useResetAllTabs();
	return useCallback(() => {
		emptyPlaylist();
		queryClient.client.clear();
		resetAllTabs();
	}, [emptyPlaylist, queryClient, resetAllTabs]);
};
