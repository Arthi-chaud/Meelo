import Resource from "./resource";

type User = Resource & {
	name: string;
	enabled: boolean;
	admin: boolean;
}

export default User;
