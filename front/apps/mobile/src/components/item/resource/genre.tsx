import type Genre from "@/models/genre";
import { GenreIcon } from "@/ui/icons";
import { ListItem } from "../list-item";

type Props = { genre: Genre | undefined };

export const GenreItem = ({ genre }: Props) => {
	return (
		<ListItem
			noIllustration
			title={genre?.name}
			subtitle={null}
			onPress={() => {}} // TODO
		/>
	);
};
