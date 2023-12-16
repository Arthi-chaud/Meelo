import { PartialType, PickType } from "@nestjs/swagger";
import { User } from "src/prisma/models";

export default class UpdateUserDTO extends PartialType(
	PickType(User, ["admin", "enabled", "name"]),
) {}
