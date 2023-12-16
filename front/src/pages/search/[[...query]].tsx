import { SearchIcon } from "../../components/icons";
import { Box, InputAdornment, TextField } from "@mui/material";
import { useState } from "react";
import SelectableInfiniteView from "../../components/infinite/selectable-infinite-view";
import { useRouter } from "next/router";
import prepareSSR, { InferSSRProps } from "../../ssr";
import API from "../../api/api";

export const getServerSideProps = prepareSSR((context) => {
	const searchQuery = context.query.query?.at(0) ?? null;
	const type = (context.query.type as string) ?? null;
	const defaultQuerySortParams = { sortBy: "name", order: "asc" } as const;

	return {
		additionalProps: { searchQuery, type },
		infiniteQueries:
			searchQuery ?
				[
					API.getArtists(
						{ query: searchQuery },
						defaultQuerySortParams,
					),
					API.getAlbums(
						{ query: searchQuery },
						defaultQuerySortParams,
						["artist"],
					),
					API.getSongs(
						{ query: searchQuery },
						defaultQuerySortParams,
						["artist", "featuring"],
					),
				]
			:	[],
	};
});

const buildSearchUrl = (
	query: string | undefined,
	type: string | undefined,
) => {
	return "/search/" + (query ?? "") + (type ? `?type=${type}` : "");
};

const SearchPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const searchQuery = props.additionalProps?.searchQuery;
	const type = props.additionalProps?.type ?? (router.query.type as string);
	const [query, setQuery] = useState<string | undefined>(
		(searchQuery ?? Array.from(router.query.query ?? []).join(" ")) ||
			undefined,
	);

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				paddingY: 3,
				flexDirection: "column",
			}}
		>
			<Box
				sx={{ display: "flex", justifyContent: "center", paddingY: 2 }}
			>
				<TextField
					id="outlined-basic"
					label="Search"
					variant="outlined"
					autoFocus
					InputProps={{
						value: query,
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon />
							</InputAdornment>
						),
					}}
					onChange={(error) => {
						setQuery(error.target.value || undefined);
						router.push(
							buildSearchUrl(error.target.value, type),
							undefined,
							{ shallow: true },
						);
					}}
				/>
			</Box>
			<SelectableInfiniteView
				default={type}
				onTypeSelect={(selectedType) =>
					router.push(
						buildSearchUrl(query, selectedType),
						undefined,
						{ shallow: true },
					)
				}
				enabled={query != undefined}
				artistQuery={({ library }, sort) =>
					API.getArtists(
						{
							query: encodeURIComponent(query!),
							library: library ?? undefined,
						},
						sort,
					)
				}
				albumQuery={({ library, type: newType }, sort) =>
					API.getAlbums(
						{
							query: encodeURIComponent(query!),
							type: newType,
							library: library ?? undefined,
						},
						sort,
						["artist"],
					)
				}
				songQuery={({ library, type: newType }, sort) =>
					API.getSongs(
						{
							query: encodeURIComponent(query!),
							type: newType,
							library: library ?? undefined,
						},
						sort,
						["artist", "featuring"],
					)
				}
			/>
		</Box>
	);
};

export default SearchPage;
