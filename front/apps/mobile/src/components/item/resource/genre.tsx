import type Genre from "@/models/genre";
import { GenreIcon } from "@/ui/icons";
import { Chip } from "~/components/chip";
import { useContextMenu } from "~/components/context-menu";
import { useGenreContextMenu } from "~/components/context-menu/resource/genre";
import { ListItem } from "../list-item";

type Props = {
	genre: Genre | undefined;
	withLeadingIcon?: boolean;
	onPress?: () => void;
	subtitle?: string;
};

export const GenreItem = ({
	genre,
	withLeadingIcon,
	subtitle,
	onPress,
}: Props) => {
	const ctxMenu = useGenreContextMenu(genre);
	const { openContextMenu } = useContextMenu(ctxMenu);
	return (
		<ListItem
			{...(withLeadingIcon
				? {
						illustration: null,
						illustrationProps: { fallbackIcon: GenreIcon },
					}
				: { leading: null })}
			title={genre?.name}
			subtitle={subtitle ?? null}
			onPress={() => {
				onPress?.();
				openContextMenu();
			}}
			contextMenu={ctxMenu}
		/>
	);
};

export const GenreChip = ({ genre }: Props) => {
	const ctxMenu = useGenreContextMenu(genre);
	const { openContextMenu } = useContextMenu(ctxMenu);
	return <Chip title={genre?.name} onPress={openContextMenu} />;
};
