import { useCallback } from "react";
import { Share } from "react-native";
import { useAPI } from "~/api";
import type { Action } from "~/actions";
import { ShareIcon } from "@/ui/icons";

export const useShareCallback = () => {
	const api = useAPI();

	return useCallback(
		(route: string) =>
			Share.share({ url: `${api.urls.api.replace("/api", "")}${route}` }),
		[api],
	);
};

export const ShareAction = (callback: () => void): Action => ({
	label: "actions.share",
	icon: ShareIcon,
	onPress: callback,
});
