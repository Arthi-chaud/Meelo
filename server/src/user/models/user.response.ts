import { Injectable } from "@nestjs/common";
import { OmitType } from "@nestjs/swagger";
import { User } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";

export default class UserResponse extends OmitType(User, ['password']) {}

@Injectable()
export class UserResponseBuilder extends ResponseBuilderInterceptor<User, UserResponse> {
	returnType = UserResponse;

	async buildResponse(input: User): Promise<UserResponse> {
		return {
			name: input.name,
			id: input.id,
			admin: input.admin,
			enabled: input.enabled
		};
	}
}
