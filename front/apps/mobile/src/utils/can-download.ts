import { Platform } from "react-native";

// iOS crashes when we try to download a file in the background.
//
// Until a fix is found, we disable the feature on this platform
export const canDownload = () => {
	return Platform.OS !== "ios";
};
