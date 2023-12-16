import { Divider, List } from "@mui/material";
import Resource from "../../models/resource";
import InfiniteScroll from "./infinite-scroll";

type TypedList<T extends Resource> = typeof InfiniteScroll<T>;
type InfiniteListProps<T extends Resource> = Omit<
	Parameters<TypedList<T>>[0],
	"render"
> & { render: (item: T) => JSX.Element };

/**
 * Similar to InfiniteGrid, but rendered as a list
 * @param props
 * @returns
 */
const InfiniteList = <T extends Resource>(props: InfiniteListProps<T>) => {
	return (
		<InfiniteScroll
			{...props}
			render={(items: T[]) => (
				<List>
					{items.map((item: T, index) => (
						<>
							{props.render(item)}
							{index == items.length - 1 || (
								<Divider variant="middle" />
							)}
						</>
					))}
				</List>
			)}
		/>
	);
};

export default InfiniteList;
