import { InfiniteQuery } from "@/api/query";
import { LayoutOption } from "@/models/layout";
import Resource from "@/models/resource";
import { InfiniteGrid } from "./grid";
import { InfiniteList } from "./list";

type Props<T, T1, P> = {
	query: InfiniteQuery<T, T1>;
	layout: LayoutOption;
	renderTile: (item: T1 | undefined) => React.ReactElement;
	renderItem: (item: T1 | undefined) => React.ReactElement;
};

export const InfiniteView = <T extends Resource, T1 extends Resource, P>({
	query,
	layout,
	renderTile,
	renderItem,
}: Props<T, T1, P>) => {
	if (layout == "grid") {
		return (
			<InfiniteGrid query={query} render={(item) => renderTile(item)} />
		);
	}
	return <InfiniteList query={query} render={(item) => renderItem(item)} />;
};
