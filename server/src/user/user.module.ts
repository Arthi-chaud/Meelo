import { Module } from '@nestjs/common';
import PrismaModule from 'src/prisma/prisma.module';
import UserController from './user.controller';
import UserService from './user.service';
import { UserResponseBuilder } from './models/user.response';

@Module({
	imports: [PrismaModule],
	providers: [UserService, UserResponseBuilder],
	controllers: [UserController],
	exports: [UserService, UserResponseBuilder]
})
export default class UserModule { }
