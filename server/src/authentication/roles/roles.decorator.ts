import { SetMetadata } from "@nestjs/common";
import RoleEnum from "./roles.enum";

export const ROLES_KEY = "roles";
const Roles = (...roles: RoleEnum[]) => SetMetadata(ROLES_KEY, roles);

export default Roles;
