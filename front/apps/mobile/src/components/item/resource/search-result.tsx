import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { SearchResult } from "@/models/search";
import { AlbumItem } from "./album";
import { ArtistItem } from "./artist";
import { SongItem } from "./song";
import { VideoItem } from "./video";

export const SearchResultItem = ({
	searchResult,
	onPress,
}: {
	searchResult: SearchResult | undefined;
	onPress: () => void;
}) => {
	const { t } = useTranslation();
	if (!searchResult || searchResult.song) {
		return (
			<SongItem
				song={searchResult?.song}
				illustrationProps={{ simpleColorPlaceholder: true }}
				subtitle="artists"
				onPress={onPress}
				formatSubtitle={(s) => `${t("models.song")} • ${s}`}
			/>
		);
	}
	if (searchResult.album) {
		return (
			<AlbumItem
				album={searchResult.album}
				illustrationProps={{ simpleColorPlaceholder: true }}
				subtitle="artistName"
				onPress={onPress}
				formatSubtitle={(s) => `${t("models.album")} • ${s}`}
			/>
		);
	}
	if (searchResult.artist) {
		return (
			<ArtistItem
				artist={searchResult.artist}
				illustrationProps={{ simpleColorPlaceholder: true }}
				onPress={onPress}
			/>
		);
	}
	if (searchResult.video) {
		return (
			<VideoItem
				video={searchResult.video}
				illustrationProps={{ simpleColorPlaceholder: true }}
				onPress={onPress}
				subtitle="artistName"
				formatSubtitle={(s) => `${t("models.video")} • ${s}`}
			/>
		);
	}
	// biome-ignore lint/suspicious/noConsole: Debug
	console.error("Unexpected search result");
	// biome-ignore lint/suspicious/noConsole: Debug
	console.error(searchResult);
	return <View />;
};
