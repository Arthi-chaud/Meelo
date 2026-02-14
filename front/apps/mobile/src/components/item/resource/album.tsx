import { type ComponentProps, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AlbumWithRelations } from "@/models/album";
import { getYear } from "@/utils/date";
import { useAlbumContextMenu } from "~/components/context-menu/resource/album";
import { ListItem } from "../list-item";
import { Tile } from "../tile";

type Props = {
	album: AlbumWithRelations<"artist" | "illustration"> | undefined;
	subtitle: "artistName" | "year";
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
	onPress?: () => void;
	formatSubtitle?: (s: string) => string;
};

export const AlbumItem = ({
	album,
	illustrationProps,
	subtitle,
	formatSubtitle,
	onPress,
}: Props) => {
	const contextMenu = useAlbumContextMenu(album);
	const formattedSubtitle = useFormattedSubtitle({
		subtitle,
		formatSubtitle,
		album,
	});
	return (
		<ListItem
			title={album?.name}
			subtitle={formattedSubtitle}
			href={album?.masterId ? `/releases/${album.masterId}` : null}
			onPress={onPress}
			contextMenu={contextMenu}
			illustration={album?.illustration}
			illustrationProps={illustrationProps}
		/>
	);
};

export const AlbumTile = ({
	album,
	illustrationProps,
	subtitle,
	onPress,
	formatSubtitle,
}: Props) => {
	const contextMenu = useAlbumContextMenu(album);
	const formattedSubtitle = useFormattedSubtitle({
		subtitle,
		formatSubtitle,
		album,
	});
	return (
		<Tile
			illustration={album?.illustration}
			illustrationProps={illustrationProps}
			title={album?.name}
			onPress={onPress}
			href={album?.masterId ? `/releases/${album.masterId}` : null}
			contextMenu={contextMenu}
			subtitle={formattedSubtitle}
		/>
	);
};

const useFormattedSubtitle = ({
	formatSubtitle,
	album,
	subtitle,
}: Pick<Props, "formatSubtitle" | "album" | "subtitle">) => {
	const { t } = useTranslation();
	return useMemo(() => {
		const f = formatSubtitle ?? ((e: string) => e);
		if (album === undefined) {
			return undefined;
		}
		if (subtitle === "year") {
			return f(getYear(album.releaseDate)?.toString() ?? "");
		}
		if (subtitle === "artistName") {
			return f(album.artist?.name ?? t("compilationArtistLabel"));
		}
		return null;
	}, [subtitle, formatSubtitle, album]);
};
