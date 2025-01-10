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
	UnauthorizedException,
} from "@nestjs/common";
import ApiKeyService from "./api_key.service";

@Injectable()
export default class ApiKeyGuard implements CanActivate {
	constructor(private apiKeyService: ApiKeyService) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const apiKey = request.headers["x-api-key"];

		if (!apiKey) {
			throw new UnauthorizedException("API key is missing.");
		}
		if (!this.apiKeyService.apiKeyIsValid(apiKey)) {
			throw new UnauthorizedException("Invalid API key.");
		}
		return true;
	}
}
