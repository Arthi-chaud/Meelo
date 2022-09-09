import { Box, Grid } from "@mui/material";
import FadeIn from "react-fade-in";
import Resource from "../../models/resource";
import InfiniteList from "./infinite-list";

type TypedList<T extends Resource> = typeof InfiniteList<T>;
type InfiniteGridProps<T extends Resource> = Omit<Parameters<TypedList<T>>[0], 'render'> & { render: (item: T) => JSX.Element }

/**
 * Similar to InfiniteList, but rendered as a grid
 * @param props 
 * @returns 
 */
const InfiniteGrid = <T extends Resource,>(props: InfiniteGridProps<T>) => {
	return <InfiniteList
		{...props}
		render={(items: T[]) =>
			<Grid sx={{ padding: 2 }} container rowSpacing={4} columnSpacing={2}>
				{items.map((item: T) => 
					<Grid item xs={6} sm={3} md={12/5} lg={2} xl={1.5} style={{ height: '100%' }} key={item.id}>
						<FadeIn>{props.render(item)}</FadeIn>
					</Grid>
				)}
			</Grid>
		}
	/>
}

export default InfiniteGrid;