import * as yup from "yup";
import Resource from "./resource";

const User = Resource.concat(
	yup.object({
		name: yup.string().required(),
		enabled: yup.boolean().required(),
		admin: yup.boolean().required(),
	}),
);

type User = yup.InferType<typeof User>;

export const UserSortingKeys = ["id", "name", "admin", "enabled"] as const;

export default User;
