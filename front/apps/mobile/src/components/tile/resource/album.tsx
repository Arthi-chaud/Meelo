import type { AlbumWithRelations } from "@/models/album";
import { useTranslation } from "react-i18next";
import { Tile } from "..";

type Props = {
	album: AlbumWithRelations<"artist" | "illustration"> | undefined;
};

export const AlbumTile = ({ album }: Props) => {
	const { t } = useTranslation();
	return (
		<Tile
			illustration={album?.illustration}
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
