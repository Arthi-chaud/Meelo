/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { SearchIcon } from "../../components/icons";
import { Box, InputAdornment, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import SelectableInfiniteView from "../../components/infinite/selectable-infinite-view";
import { useRouter } from "next/router";
import { GetPropsTypesFrom, Page } from "../../ssr";
import API from "../../api/api";
import { NextPageContext } from "next";
import { Head } from "../../components/head";
import { useTranslation } from "react-i18next";

const prepareSSR = (context: NextPageContext) => {
	const searchQuery = context.query.query?.at(0) ?? null;
	const type = (context.query.type as string) ?? null;

	return {
		additionalProps: { searchQuery, type },
		infiniteQueries: searchQuery
			? [
					API.getArtists({ query: searchQuery }, undefined, [
						"illustration",
					]),
					API.getAlbums({ query: searchQuery }, undefined, [
						"artist",
						"illustration",
					]),
					API.getSongs({ query: searchQuery }, undefined, [
						"artist",
						"featuring",
						"master",
						"illustration",
					]),
				]
			: [],
	};
};

const buildSearchUrl = (
	query: string | undefined,
	type: string | undefined,
) => {
	return "/search/" + (query ?? "") + (type ? `?type=${type}` : "");
};

const SearchPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const router = useRouter();
	const searchQuery = props?.searchQuery;
	const { t } = useTranslation();
	const type = props?.type ?? (router.query.type as string);
	const [query, setQuery] = useState<string | undefined>(
		(searchQuery ?? Array.from(router.query.query ?? []).join(" ")) ||
			undefined,
	);
	const [inputValue, setInputValue] = useState(query);
	const [debounceId, setDebounceId] = useState<NodeJS.Timeout>();
	useEffect(() => {
		if (debounceId) {
			clearTimeout(debounceId);
		}
		setDebounceId(
			setTimeout(() => {
				setQuery(inputValue || undefined);
				router.push(buildSearchUrl(inputValue, type), undefined, {
					shallow: true,
				});
				setDebounceId(undefined);
			}, 500),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [inputValue]);
	useEffect(() => {
		return () => {
			clearTimeout(debounceId);
		};
	}, [debounceId]);

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				paddingY: 3,
				flexDirection: "column",
			}}
		>
			<Head title={t("search")} />
			<Box
				sx={{ display: "flex", justifyContent: "center", paddingY: 2 }}
			>
				<TextField
					id="outlined-basic"
					label="Search"
					variant="outlined"
					autoFocus
					InputProps={{
						value: inputValue,
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon />
							</InputAdornment>
						),
					}}
					onChange={(event) => {
						setInputValue(event.target.value || undefined);
					}}
				/>
			</Box>
			<SelectableInfiniteView
				disableSorting
				default={type}
				onTypeSelect={(selectedType) =>
					router.push(
						buildSearchUrl(query, selectedType),
						undefined,
						{
							shallow: true,
						},
					)
				}
				enabled={query != undefined}
				artistQuery={({ library }) =>
					API.getArtists(
						{
							query: encodeURIComponent(query!),
							library: library ?? undefined,
						},
						undefined,
						["illustration"],
					)
				}
				albumQuery={({ library, type: newType }) =>
					API.getAlbums(
						{
							query: encodeURIComponent(query!),
							type: newType,
							library: library ?? undefined,
						},
						undefined,
						["artist", "illustration"],
					)
				}
				songQuery={({ library, type: newType }) =>
					API.getSongs(
						{
							query: encodeURIComponent(query!),
							type: newType,
							library: library ?? undefined,
						},
						undefined,
						["artist", "featuring", "master", "illustration"],
					)
				}
			/>
		</Box>
	);
};

SearchPage.prepareSSR = prepareSSR;

export default SearchPage;
