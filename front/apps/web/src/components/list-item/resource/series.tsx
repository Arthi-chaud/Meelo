import type Series from "@/models/series";
import { SeriesIcon } from "@/ui/icons";
import Illustration from "~/components/illustration";
import ListItem from "..";

export const SeriesItem = ({
	series,
	secondTitle,
	onClick,
}: {
	series: Series | undefined;
	secondTitle?: string;
	onClick?: () => void;
}) => {
	return (
		<ListItem
			title={series?.name}
			secondTitle={secondTitle ?? null}
			href={series ? `/series/${series.slug}` : undefined}
			onClick={onClick}
			icon={
				<Illustration
					illustration={null}
					quality="original"
					fallback={<SeriesIcon />}
				/>
			}
		/>
	);
};
