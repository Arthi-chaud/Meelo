import type { TrackWithRelations } from "@/models/track";
import type { ComponentProps } from "react";
import { ListItem } from "~/components/item/list-item";

type Props = {
	track: TrackWithRelations<"illustration" | "release"> | undefined;
	illustrationProps: ComponentProps<typeof ListItem>["illustrationProps"];
};

export const TrackItem = ({ track, illustrationProps }: Props) => {
	return (
		<ListItem
			title={track?.name}
			onPress={() => {}}
			subtitle={track?.release?.name}
			illustration={track?.illustration}
			illustrationProps={illustrationProps}
		/>
	);
};
