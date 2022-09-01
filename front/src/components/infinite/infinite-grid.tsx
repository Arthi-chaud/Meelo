import { Box, Grid } from "@mui/material";
import FadeIn from "react-fade-in";
import Resource from "../../models/resource";
import InfiniteList from "./infinite-list";

/**
 * Similar to InfiniteList, but rendered as a grid
 * @param props 
 * @returns 
 */
const InfiniteGrid = <T extends Resource,>(props: Omit<Parameters<typeof InfiniteList>[0], 'render'> & { render: (item: T) => JSX.Element }) => {
	return <InfiniteList
		loader={props.loader}
		firstLoader={props.firstLoader}
		fetch={props.fetch}
		queryKey={props.queryKey}
		pageSize={props.pageSize}
		render={(items: T[]) =>
			<Grid sx={{ padding: 2 }} container rowSpacing={4} columnSpacing={2}>
				{items.map((item: T) => 
					<Grid item xs={6} md={12/5} lg={2} xl={1.5} style={{ height: '100%' }} key={item.id}>
						<FadeIn>{props.render(item)}</FadeIn>
					</Grid>
				)}
			</Grid>
		}
	/>
}

export default InfiniteGrid;