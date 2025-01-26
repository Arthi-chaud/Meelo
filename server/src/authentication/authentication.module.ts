/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import SettingsModule from "src/settings/settings.module";
import UserModule from "src/user/user.module";
import ApiKeyService from "./api_key.service";
import AuthenticationController from "./authentication.controller";
import AuthenticationService from "./authentication.service";
import { JwtStrategy } from "./jwt/jwt.strategy";
import RolesGuard from "./roles/roles.guard";

@Module({
	imports: [
		UserModule,
		PassportModule,
		SettingsModule,
		JwtModule.register({
			secret: process.env.JWT_SIGNATURE,
			signOptions: { expiresIn: "100 days" },
		}),
	],
	controllers: [AuthenticationController],
	exports: [RolesGuard, ApiKeyService],
	providers: [AuthenticationService, JwtStrategy, RolesGuard, ApiKeyService],
})
export default class AuthenticationModule {}
