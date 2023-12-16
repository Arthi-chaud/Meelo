import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import UserModule from "src/user/user.module";
import AuthenticationController from "./authentication.controller";
import AuthenticationService from "./authentication.service";
import { JwtStrategy } from "./jwt/jwt.strategy";
import LocalStrategy from "./local/local.strategy";

@Module({
	imports: [
		UserModule,
		PassportModule,
		JwtModule.register({
			secret: process.env.JWT_SIGNATURE,
			signOptions: { expiresIn: "100 days" },
		}),
	],
	controllers: [AuthenticationController],
	providers: [AuthenticationService, LocalStrategy, JwtStrategy],
})
export default class AuthenticationModule {}
