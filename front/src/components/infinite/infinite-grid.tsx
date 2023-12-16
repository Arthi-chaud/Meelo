import { Grid } from "@mui/material";
import Resource from "../../models/resource";
import InfiniteScroll from "./infinite-scroll";

type TypedList<T extends Resource> = typeof InfiniteScroll<T>;
type InfiniteGridProps<T extends Resource> = Omit<
	Parameters<TypedList<T>>[0],
	"render"
> & { render: (item: T) => JSX.Element };

/**
 * Infinite Scrolling List
 * @param props
 * @returns
 */
const InfiniteGrid = <T extends Resource>(props: InfiniteGridProps<T>) => {
	return (
		<InfiniteScroll
			{...props}
			render={(items: T[]) => (
				<Grid
					columnSpacing={2}
					container
					sx={{ alignItems: "stretch", display: "flex" }}
				>
					{items.map((item: T) => (
						<Grid
							item
							xs={6}
							sm={3}
							md={12 / 5}
							lg={2}
							xl={1.5}
							key={item.id}
						>
							{props.render(item)}
						</Grid>
					))}
				</Grid>
			)}
		/>
	);
};

export default InfiniteGrid;
