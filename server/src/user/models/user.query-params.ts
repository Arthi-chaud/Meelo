import { User } from 'src/prisma/models';
import { ModelSortingParameter } from 'src/sort/models/sorting-parameter';
import { RequireExactlyOne } from 'type-fest';

namespace UserQueryParameters {

	/**
	 * Parameeters to create a user
	 */
	export type CreateInput = Omit<User, 'id' | 'enabled' | 'admin'> & Partial<Pick<User, 'enabled' | 'admin'>>;

	/**
	 * Parameters to find one users
	 */
	export type WhereInput = RequireExactlyOne<{
		id: User['id'];
		byCredentials: Pick<User, 'name' | 'password' >;
		name: User['name'];
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
	export type DeleteInput = RequireExactlyOne<Pick<User, 'id' | 'name'>>;

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
	export class SortingParameter extends ModelSortingParameter(SortingKeys) {}
}

export default UserQueryParameters;
