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

import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
	InsufficientPermissionsException,
	UnauthorizedAnonymousRequestException,
} from "src/authentication/authentication.exception";
import UserService from "src/user/user.service";
import RoleEnum from "./roles.enum";
import { ROLES_KEY } from "./roles.decorators";
import SettingsService from "src/settings/settings.service";
import { User } from "@prisma/client";
import { AuthMethod } from "../models/auth.enum";
import ApiKeyService from "../api_key.service";

@Injectable()
export default class RolesGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private userService: UserService,
		private apiKeyService: ApiKeyService,
		private settingsService: SettingsService,
	) {}

	public getAuthMethod(context: ExecutionContext): AuthMethod {
		const roles = this.reflector.getAllAndOverride<RoleEnum[] | undefined>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);
		const request = context.switchToHttp().getRequest();
		// there is no decoration, we apply the default policy
		if (roles === undefined) {
			if (this.settingsService.settingsValues.allowAnonymous) {
				return AuthMethod.Nothing;
			}
			return AuthMethod.JWT;
		}
		if (roles?.includes(RoleEnum.Anonymous)) {
			return AuthMethod.Nothing;
		}
		if (roles?.includes(RoleEnum.Microservice)) {
			return AuthMethod.ApiKey;
		}
		// Admin or User role
		return AuthMethod.JWT;
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const roles = this.reflector.getAllAndOverride<RoleEnum[] | undefined>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);
		const request = context.switchToHttp().getRequest();
		switch (this.getAuthMethod(context)) {
			case AuthMethod.Nothing:
				return true;
			case AuthMethod.ApiKey:
				return this.apiKeyService.apiKeyIsValid(
					request.headers["x-api-key"] ?? "",
				);
			case AuthMethod.JWT: {
				const userPayload = request.user as User | undefined;
				if (!userPayload) {
					throw new UnauthorizedAnonymousRequestException();
				}
				const user = await this.userService.get({ id: userPayload.id });

				if (roles?.includes(RoleEnum.Admin) && !user.admin) {
					throw new InsufficientPermissionsException();
				}
				return true;
			}
		}
	}
}
