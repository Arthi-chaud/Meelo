import { z } from "zod";
import Resource from "./resource";

const User = Resource.and(z.object({
	name: z.string(),
	enabled: z.boolean(),
	admin: z.boolean(),
}));

type User = z.infer<typeof User>;

export const UserSortingKeys = [
	'id',
	'name',
	'admin',
	'enabled'
] as const;

export default User;
