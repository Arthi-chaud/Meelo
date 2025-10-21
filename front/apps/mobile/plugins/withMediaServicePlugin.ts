import type { ConfigPlugin } from "@expo/config-plugins";
import { getMainApplicationOrThrow } from "@expo/config-plugins/build/android/Manifest";
import { withAndroidManifest } from "@expo/config-plugins/build/plugins/android-plugins";

const withMediaServicePlugin: ConfigPlugin = (oldConfig) => {
	return withAndroidManifest(oldConfig, (config) => {
		const mainApplication = getMainApplicationOrThrow(config.modResults);
		mainApplication.service ??= [];
		mainApplication.service.push({
			$: {
				"android:name":
					"com.twg.video.core.services.playback.VideoPlaybackService",
				"android:exported": "false",
				"android:foregroundServiceType": "mediaPlayback",
			},
			"intent-filter": [
				{
					action: [
						{
							$: {
								"android:name":
									"androidx.media3.session.MediaSessionService",
							},
						},
					],
				},
			],
		});
		return config;
	});
};

export default withMediaServicePlugin;
