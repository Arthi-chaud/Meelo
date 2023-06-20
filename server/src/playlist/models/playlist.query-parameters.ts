import { PickType } from "@nestjs/swagger";
import { Playlist } from "src/prisma/models";
import Slug from "src/slug/slug";
import SongQueryParameters from "src/song/models/song.query-params";
import type { RequireAtLeastOne, RequireExactlyOne } from "type-fest";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include";
import { ModelSortingParameter } from "src/sort/models/sorting-parameter";
import AlbumQueryParameters from "src/album/models/album.query-parameters";

namespace PlaylistQueryParameters {
	/**
	 * The input required to save a playlist in the database
	 */
	export class CreateInput extends PickType(Playlist, ['name'] as const) {}

	/**
	 * Query parameters to find one playlist
	 */
	export type WhereInput = RequireExactlyOne<{
		id: Playlist['id'],
		slug: Slug
	}>;

	/**
	 * Query parameters to find multiple playlist
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		song: SongQueryParameters.WhereInput,
		album: AlbumQueryParameters.WhereInput
	}>>;

	/**
 	 * The input required to update an album in the database
 	 */
	export type UpdateInput = CreateInput;

	/**
	 * The input to find or create an album
	 */
	export type GetOrCreateInput = CreateInput;

	/**
	 * Query parameters to delete one album
	 */
	export type DeleteInput = WhereInput;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['entries'] as const;
	export const AvailableAtomicIncludes = AvailableIncludes;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		'id',
		'name',
		'entryCount',
		'creationDate'
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default PlaylistQueryParameters;
