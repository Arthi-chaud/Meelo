import Resource from "./resource";

type User = Resource & {
	name: string;
	enabled: boolean;
	admin: boolean;
}

export const UserSortingKeys = [
	'id',
	'name',
	'admin',
	'enabled'
] as const;

export default User;
