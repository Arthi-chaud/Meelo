import { Module } from '@nestjs/common';
import PrismaModule from 'src/prisma/prisma.module';
import UserController from './user.controller';
import UserService from './user.service';

@Module({
	imports: [PrismaModule],
	providers: [UserService],
	controllers: [UserController],
	exports: [UserService]
})
export default class UserModule { }
