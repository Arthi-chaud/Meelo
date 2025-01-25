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

// Collections of Interceptors, Pipes & Filters for the global app

import {
	ClassSerializerInterceptor,
	type INestApplication,
	type MiddlewareConsumer,
	RequestMethod,
	ValidationPipe,
} from "@nestjs/common";
import { APP_GUARD, HttpAdapterHost, Reflector } from "@nestjs/core";
import { InvalidRequestException } from "./exceptions/meelo-exception";
import AllExceptionsFilter from "./exceptions/all-exceptions.filter";
import MeeloExceptionFilter from "./exceptions/meelo-exception.filter";
import NotFoundExceptionFilter from "./exceptions/not-found.exception";
import mime from "mime";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { JwtCookieMiddleware } from "./authentication/jwt/jwt-middleware";
import JwtAuthGuard from "./authentication/jwt/jwt-auth.guard";
import RolesGuard from "./authentication/roles/roles.guard";

// To call before application bootstrap/launch
const presetup = () => {
	mime.define(
		{
			"audio/mpeg": ["m4a", mime.getExtension("audio/mpeg")!],
		},
		true,
	);
};

// Interceptors to use
const buildInterceptors = (app: INestApplication) => [
	new ClassSerializerInterceptor(app.get(Reflector)),
];

const buildExceptionFilters = (app: INestApplication) => [
	new AllExceptionsFilter(app.get(HttpAdapterHost)),
	new NotFoundExceptionFilter(),
	new MeeloExceptionFilter(),
];

const buildPipes = (_app: INestApplication) => [
	new ValidationPipe({
		transform: true,
		exceptionFactory: (error) => {
			const failedConstraint = Object.keys(error[0].constraints!)[0];

			return new InvalidRequestException(
				error[0].constraints![failedConstraint],
			);
		},
		whitelist: true,
		transformOptions: {
			enableImplicitConversion: true,
		},
	}),
];

const buildHttpPlugs = (_app: INestApplication) => [
	helmet({
		crossOriginResourcePolicy:
			process.env.NODE_ENV === "development"
				? { policy: "cross-origin" }
				: true,
	}),
	cookieParser(),
];

const applyMiddlewares = (consumer: MiddlewareConsumer) =>
	consumer
		.apply(JwtCookieMiddleware)
		.forRoutes({ path: "*", method: RequestMethod.ALL });

const AppProviders = [
	{
		provide: APP_GUARD,
		useClass: JwtAuthGuard,
	},
	{
		provide: APP_GUARD,
		useClass: RolesGuard,
	},
];

export {
	presetup,
	buildInterceptors,
	applyMiddlewares,
	buildPipes,
	buildExceptionFilters,
	buildHttpPlugs,
	AppProviders,
};
