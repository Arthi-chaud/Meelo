import { PickType } from "@nestjs/swagger";
import { User } from "src/prisma/models";
/**
 * Type of the decoded JWT Payload
 */
export default class JwtPayload extends PickType(User, ["id", "name"]) {}
