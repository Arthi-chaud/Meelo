import { OmitType } from "@nestjs/swagger";
import { User } from "src/prisma/models";

export default class UserResponse extends OmitType(User, ['password']) {}
