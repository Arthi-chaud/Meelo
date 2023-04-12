import { Box, Stack } from "@mui/material";
import Tile from "./tile/tile";

type TileRowProps = {
	tiles: ReturnType<typeof Tile>[];
	windowSize?: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number>>;
}

const TileRow = (props: TileRowProps) => {
	const windowSize = {
		xs: props.windowSize?.xs ?? 2,
		sm: props.windowSize?.sm ?? 3,
		md: props.windowSize?.md ?? 5,
		lg: props.windowSize?.lg ?? 6,
		xl: props.windowSize?.xl ?? 8
	};
	const width = Object.entries(windowSize)
		.reduce((prev, [key, size]) => ({ ...prev, [key]: 100/size + '%' }), {});

	return <Stack sx={{ overflowX: 'scroll', paddingBottom: 1, width: '100%' }} direction='row'>
		{props.tiles.map((tile, tileIndex) =>
			<Box key={tileIndex} sx={{ paddingX: 1, minWidth: width, maxWidth: width }}>
				{tile}
			</Box>)
		}
	</Stack>;
};

export default TileRow;
