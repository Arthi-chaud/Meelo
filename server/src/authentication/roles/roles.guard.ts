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

import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
} from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import {
	InsufficientPermissionsException,
	MissingApiKeyPermissionsException,
	UnauthorizedAnonymousRequestException,
} from "src/authentication/authentication.exception";
import type UserService from "src/user/user.service";
import RoleEnum from "./roles.enum";
import { ROLES_KEY } from "./roles.decorators";
import type SettingsService from "src/settings/settings.service";
import type { User } from "@prisma/client";
import { AuthMethod } from "../models/auth.enum";
import type ApiKeyService from "../api_key.service";

@Injectable()
export default class RolesGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private userService: UserService,
		private apiKeyService: ApiKeyService,
		private settingsService: SettingsService,
	) {}

	/// @returns a list of authentication method that are accepted
	public getAuthMethod(context: ExecutionContext): AuthMethod[] {
		const roles = this.reflector.getAllAndOverride<RoleEnum[] | undefined>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);
		const authMethods: AuthMethod[] = [];
		// there is no decoration, we apply the default policy
		if (roles === undefined || roles?.includes(RoleEnum.Default)) {
			if (this.settingsService.settingsValues.allowAnonymous) {
				authMethods.push(AuthMethod.Nothing);
			} else {
				authMethods.push(AuthMethod.JWT);
			}
		}
		if (roles?.includes(RoleEnum.Anonymous)) {
			authMethods.push(AuthMethod.Nothing);
		}
		if (roles?.includes(RoleEnum.Microservice)) {
			authMethods.push(AuthMethod.ApiKey);
		}
		if (roles?.includes(RoleEnum.Admin) || roles?.includes(RoleEnum.User)) {
			authMethods.push(AuthMethod.JWT);
		}
		return authMethods;
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const roles = this.reflector.getAllAndOverride<RoleEnum[] | undefined>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);
		const errors: Error[] = [];
		const request = context.switchToHttp().getRequest();
		const validAuthMethods = this.getAuthMethod(context);
		if (validAuthMethods.includes(AuthMethod.Nothing)) {
			return true;
		}
		if (validAuthMethods.includes(AuthMethod.ApiKey)) {
			const receivedApiKey = request.headers["x-api-key"];
			if (
				receivedApiKey &&
				this.apiKeyService.apiKeyIsValid(receivedApiKey)
			) {
				return true;
			}
			errors.push(new MissingApiKeyPermissionsException());
		}
		if (validAuthMethods.includes(AuthMethod.JWT)) {
			const userPayload = request.user as User | undefined;
			if (!userPayload) {
				errors.push(new UnauthorizedAnonymousRequestException());
			} else {
				const user = await this.userService.get({ id: userPayload.id });

				if (roles?.includes(RoleEnum.Admin) && !user.admin) {
					errors.push(new InsufficientPermissionsException());
				} else {
					return true;
				}
			}
		}
		if (errors.length > 0) {
			throw errors[0];
		}
		// Probably dead code.
		return false;
	}
}
