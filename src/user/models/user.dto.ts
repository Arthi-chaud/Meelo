import { OmitType } from "@nestjs/swagger";
import { User } from "src/prisma/models";
export default class UserCreateDTO extends OmitType(User, ['id', 'enabled']) {}