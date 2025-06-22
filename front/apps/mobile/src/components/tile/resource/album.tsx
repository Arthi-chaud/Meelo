import type { AlbumWithRelations } from "@/models/album";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Tile } from "..";

type Props = {
	album: AlbumWithRelations<"artist" | "illustration"> | undefined;
	illustrationProps?: ComponentProps<typeof Tile>["illustrationProps"];
};

export const AlbumTile = ({ album, illustrationProps }: Props) => {
	const { t } = useTranslation();
	return (
		<Tile
			illustration={album?.illustration}
			illustrationProps={illustrationProps}
			title={album?.name}
			href={`/releases/${album?.masterId}`}
			subtitle={
				album === undefined
					? undefined
					: (album.artist?.name ?? t("compilationArtistLabel"))
			}
		/>
	);
};
