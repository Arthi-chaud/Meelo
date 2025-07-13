import type { AlbumWithRelations } from "@/models/album";
import { getYear } from "@/utils/date";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Tile } from "..";

type Props = {
	album: AlbumWithRelations<"artist" | "illustration"> | undefined;
	subtitle: "artistName" | "year";
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
};

export const AlbumTile = ({ album, illustrationProps, subtitle }: Props) => {
	const { t } = useTranslation();
	return (
		<Tile
			illustration={album?.illustration}
			illustrationProps={illustrationProps}
			title={album?.name}
			href={album?.masterId ? `/releases/${album.masterId}` : null}
			subtitle={
				album === undefined
					? undefined
					: subtitle === "year"
						? (getYear(album.releaseDate)?.toString() ?? "")
						: (album.artist?.name ?? t("compilationArtistLabel"))
			}
		/>
	);
};
