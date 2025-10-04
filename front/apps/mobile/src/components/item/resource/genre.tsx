import type Genre from "@/models/genre";
import { Chip } from "~/components/chip";
import { useContextMenu } from "~/components/context-menu";
import { useGenreContextMenu } from "~/components/context-menu/resource/genre";
import { ListItem } from "../list-item";

type Props = { genre: Genre | undefined };

export const GenreItem = ({ genre }: Props) => {
	const ctxMenu = useGenreContextMenu(genre);
	const { openContextMenu } = useContextMenu(ctxMenu);
	return (
		<ListItem
			noIllustration
			title={genre?.name}
			subtitle={null}
			onPress={openContextMenu}
			contextMenu={ctxMenu}
		/>
	);
};

export const GenreChip = ({ genre }: Props) => {
	const ctxMenu = useGenreContextMenu(genre);
	const { openContextMenu } = useContextMenu(ctxMenu);
	return <Chip title={genre?.name} onPress={openContextMenu} />;
};
