import { User } from 'src/prisma/models';
import RequireOnlyOne from 'src/utils/require-only-one';
import BaseSortingParameter from 'src/sort/models/sorting-parameter';
import { ApiPropertyOptional } from '@nestjs/swagger';

namespace UserQueryParameters {

	/**
	 * Parameeters to create a user
	 */
	export type CreateInput = Omit<User, 'id' | 'enabled' | 'admin'> & Partial<Pick<User, 'enabled' | 'admin'>>;

	/**
	 * Parameters to find one users
	 */
	export type WhereInput = RequireOnlyOne<{
		byId: Pick<User, 'id'>;
		byCredentials: Pick<User, 'name' | 'password' >;
		byName: Pick<User, 'name'>
	}>

	/**
	 * Parameters to find multiple users
	 */
	export type ManyWhereInput = Partial<Pick<User, 'admin' | 'enabled'>>;

	/**
	 * Parameters to update a user
	 */
	export type UpdateInput = Partial<Omit<User, 'id'>>;

	/**
	 * Query parameters to delete one user
	 */
	export type DeleteInput = RequireOnlyOne<Pick<User, 'id' | 'name'>>;

	/**
	 * Defines how to sort fetched entries
	 */
	export const SortingKeys = [
		'id',
		'name',
		'admin',
		'enabled'
	] as const;
	export type SortingKeys = typeof SortingKeys;
	export class SortingParameter extends BaseSortingParameter<SortingKeys>{
		@ApiPropertyOptional({ enum: SortingKeys })
		sortBy: SortingKeys[number];
	}
}

export default UserQueryParameters;
