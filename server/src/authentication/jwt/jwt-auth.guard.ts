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

import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { ROLES_KEY } from "../roles/roles.decorators";
import Roles from "../roles/roles.enum";
import RolesGuard from "../roles/roles.guard";
import { AuthMethod } from "../models/auth.enum";

@Injectable()
export default class JwtAuthGuard extends AuthGuard("jwt") {
	constructor(private reflector: Reflector, private rolesGuard: RolesGuard) {
		super();
	}

	handleRequest(
		err: any,
		user: any,
		_info: any,
		context: ExecutionContext,
		_status?: any,
	): any {
		// Note: Injecting RolesGuard is a hack to enable JWT Guard conditionally,
		// as it is enabled by default globally.
		if (this.rolesGuard.getAuthMethod(context) !== AuthMethod.JWT) {
			return undefined;
		}
		if (err) {
			throw err;
		}
		return user;
	}

	canActivate(context: ExecutionContext) {
		if (!this.needsJwt(context)) {
			return true;
		}
		return super.canActivate(context);
	}

	private needsJwt(context: ExecutionContext) {
		const roles = this.reflector.getAllAndOverride<Roles[] | undefined>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);
		if (
			roles?.includes(Roles.Anonymous) ||
			roles?.includes(Roles.Microservice)
		) {
			return false;
		}
		return true;
	}
}
