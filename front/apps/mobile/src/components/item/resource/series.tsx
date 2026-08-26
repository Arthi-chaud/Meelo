import type Series from "@/models/series";
import { SeriesIcon } from "@/ui/icons";
import { ListItem } from "../list-item";

type Props = {
	series: Series | undefined;
	withLeadingIcon?: boolean;
	subtitle?: string;
	onPress?: () => void;
};

export const SeriesItem = ({
	series,
	subtitle,
	withLeadingIcon,
	onPress,
}: Props) => {
	return (
		<ListItem
			{...(withLeadingIcon
				? {
						illustration: null,
						illustrationProps: { fallbackIcon: SeriesIcon },
					}
				: { leading: null })}
			title={series?.name}
			subtitle={subtitle ?? null}
			href={series ? `/albums?series=${series.id}` : undefined}
			onPress={() => {
				onPress?.();
			}}
		/>
	);
};
