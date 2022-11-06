import { User } from 'src/prisma/models';
import RequireOnlyOne from 'src/utils/require-only-one';

namespace UserQueryParameters {
	
	/**
	 * Paramters to create a user
	 */
	export type CreateInput = Omit<User, 'enabled' | 'id'>;

	/**
	 * Parameters to find one users
	 */
	export type WhereInput = RequireOnlyOne<{
		byId: Pick<User, 'id'>;
		byCredentials: Pick<User,  'name' | 'password' >;
		byName: Pick<User,  'name'>
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
}

export default UserQueryParameters;