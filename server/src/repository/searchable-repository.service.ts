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

import { MeiliSearch } from "meilisearch";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { sortItemsUsingOrderedIdList } from "./repository.utils";

/// Base functions for a Repository that integrates Meilisearch
export default abstract class SearchableRepositoryService {
	constructor(
		public readonly indexName: string,
		protected searchableKeys: string[],
		protected readonly meiliSearch: MeiliSearch,
	) {
		this.meiliSearch
			.createIndex(this.indexName, {
				primaryKey: "id",
			})
			.waitTask()
			.then(async () => {
				this.meiliSearch
					.index(this.indexName)
					.updateSearchableAttributes(searchableKeys);
				this.meiliSearch
					.index(this.indexName)
					.updateDisplayedAttributes(["id"]);
			});
	}

	/**
	 * Provides the list of matching items
	 * @return the paginated list
	 */
	protected async getMatchingIds(
		token: string,
		pagination?: PaginationParameters,
	) {
		const matches = await this.meiliSearch
			.index(this.indexName)
			.searchGet(token, {
				offset: pagination?.skip,
				limit:
					// if skip if specified, afterId is not
					// so we can directly do pagination here
					pagination?.skip !== undefined
						? pagination.take
						: undefined,
			})
			.then((res) => res.hits.map((hit) => hit.id as number));
		if (pagination?.afterId !== undefined) {
			const indexOfFirstItem = matches.indexOf(pagination.afterId) + 1;
			return matches.slice(indexOfFirstItem, pagination?.take);
		}
		return matches;
	}

	protected sortItemsUsingMatchList<T extends { id: number }>(
		matches: number[],
		items: T[],
	) {
		return sortItemsUsingOrderedIdList(matches, items);
	}
}
