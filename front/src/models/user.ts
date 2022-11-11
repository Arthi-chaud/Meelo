import Resource from "./resource";

type User = Resource & {
	name: string;
	password: string;
	enabled: boolean;
	admin: boolean;
}

export default User;