import type { AlbumWithRelations } from "@/models/album";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { ListItem } from "..";

type Props = {
	album: AlbumWithRelations<"illustration" | "artist"> | undefined;
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
};

export const AlbumItem = ({ album, illustrationProps }: Props) => {
	const { t } = useTranslation();
	return (
		<ListItem
			title={album?.name}
			subtitle={album?.artist?.name ?? t("compilationArtistLabel")}
			{...(album === undefined
				? { onPress: () => {}, href: undefined }
				: { href: `/releases/${album.masterId}`, onPress: undefined })}
			illustration={album?.illustration}
			illustrationProps={illustrationProps}
		/>
	);
};
