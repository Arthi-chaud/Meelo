import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InsufficientPermissionsException } from "src/authentication/authentication.exception";
import { IS_PUBLIC_KEY } from "src/authentication/roles/public.decorator";
import UserService from "src/user/user.service";
import RoleEnum from "./roles.enum";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export default class RolesGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private userService: UserService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<RoleEnum[]>(
			IS_PUBLIC_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (isPublic) {
			return true;
		}
		const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (!requiredRoles) {
			return true;
		}
		const request = context.switchToHttp().getRequest();
		const userPayload = request.user;
		const user = await this.userService.get({ id: userPayload.id });

		if (requiredRoles.includes(RoleEnum.Admin) && !user.admin) {
			throw new InsufficientPermissionsException();
		}
		return true;
	}
}
