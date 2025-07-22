import type { AlbumWithRelations } from "@/models/album";
import { getYear } from "@/utils/date";
import { type ComponentProps, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ListItem } from "..";

type Props = {
	album: AlbumWithRelations<"illustration" | "artist"> | undefined;
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
	subtitle: "artistName" | "year";
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
	const { t } = useTranslation();

	const formattedSubtitle = useMemo(() => {
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
	return (
		<ListItem
			title={album?.name}
			subtitle={formattedSubtitle}
			href={album?.masterId ? `/releases/${album.masterId}` : null}
			onPress={onPress}
			illustration={album?.illustration}
			illustrationProps={illustrationProps}
		/>
	);
};
