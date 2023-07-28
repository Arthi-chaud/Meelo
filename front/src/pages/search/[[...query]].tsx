import { Search } from "@mui/icons-material";
import {
	Box, InputAdornment, TextField
} from "@mui/material";
import { useState } from "react";
import SelectableInfiniteView from "../../components/infinite/selectable-infinite-view";
import { useRouter } from "next/router";
import prepareSSR, { InferSSRProps } from "../../ssr";
import API from "../../api/api";

export const getServerSideProps = prepareSSR((context) => {
	const searchQuery = context.query.query as string ?? null;
	const type = context.query.type as string ?? null;

	return {
		additionalProps: { searchQuery, type },
		infiniteQueries: [
			API.searchArtists(searchQuery),
			API.searchAlbums(searchQuery, undefined, undefined, ['artist']),
			API.searchSongs(searchQuery, undefined, undefined, ['artist'])
		]
	};
});

const buildSearchUrl = (query: string | undefined, type: string | undefined) => {
	return "/search/" + (query ?? '') + (type ? `?type=${type}` : '');
};

const SearchPage = (
	{ type, searchQuery }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	type ??= router.query.type as string;
	const [query, setQuery] = useState<string | undefined>(Array.from(
		searchQuery ?? router.query.query as string | undefined ?? []
	).join(' ') || undefined);

	return <Box sx={{ display: 'flex', justifyContent: 'center', paddingY: 3, flexDirection: 'column' }}>
		<Box sx={{ display: 'flex', justifyContent: 'center', paddingY: 2 }}>
			<TextField id="outlined-basic" label="Search" variant="outlined"
				autoFocus InputProps={{
					value: query,
					startAdornment: <InputAdornment position="start">
						<Search />
					</InputAdornment>
					,
				}} onChange={(error) => {
					setQuery(error.target.value || undefined);
					router.push(
						buildSearchUrl(error.target.value, type), undefined, { shallow: true }
					);
				}}/>
		</Box>
		<SelectableInfiniteView
			default={type}
			onTypeSelect={(selectedType) =>
				router.push(buildSearchUrl(query, selectedType), undefined, { shallow: true })}
			enabled={query != undefined}
			artistQuery={(sort) => API.searchArtists(encodeURIComponent(query!), sort)}
			albumQuery={(sort, selectedType) =>
				API.searchAlbums(encodeURIComponent(query!), selectedType, sort, ['artist'])
			}
			songQuery={(sort, selectedType) => API.searchSongs(encodeURIComponent(query!), sort, selectedType, ['artist'])}
		/>
	</Box>;
};

export default SearchPage;
