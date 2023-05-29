/* eslint-disable array-bracket-newline */
// Collections of Interceptors, Pipes & Filters for the global app

import {
	ClassSerializerInterceptor,
	INestApplication,
	MiddlewareConsumer,
	RequestMethod,
	ValidationPipe
} from "@nestjs/common";
import {
	APP_GUARD, HttpAdapterHost, Reflector
} from "@nestjs/core";
import { InvalidRequestException } from "./exceptions/meelo-exception";
import AllExceptionsFilter from "./exceptions/all-exceptions.filter";
import MeeloExceptionFilter from "./exceptions/meelo-exception.filter";
import NotFoundExceptionFilter from "./exceptions/not-found.exception";
import mime from "mime";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { JwtCookieMiddleware } from "./authentication/jwt/jwt-middleware";
import JwtAuthGuard from "./authentication/jwt/jwt-auth.guard";
import RolesGuard from "./roles/roles.guard";

// To call before application bootstrap/launch
const presetup = () => {
	mime.define({
		'audio/mpeg': ['m4a', mime.getExtension('audio/mpeg')!]
	}, true);
};

// Interceptors to use
const buildInterceptors = (app: INestApplication) => [
	new ClassSerializerInterceptor(app.get(Reflector)),
];

const buildExceptionFilters = (app: INestApplication) => [
	new AllExceptionsFilter(app.get(HttpAdapterHost)),
	new NotFoundExceptionFilter(),
	new MeeloExceptionFilter()
];

const buildPipes = (_app: INestApplication) => [
	new ValidationPipe({
		transform: true,
		exceptionFactory: (error) => {
			const failedConstraint = Object.keys(error[0].constraints!)[0];

			return new InvalidRequestException(error[0].constraints![failedConstraint]);
		},
		whitelist: true,
		transformOptions: {
			enableImplicitConversion: true
		},
	})
];

const buildHttpPlugs = (_app: INestApplication) => [
	helmet({
		crossOriginResourcePolicy: process.env.NODE_ENV === 'development'
			? { policy: 'cross-origin' }
			: true
	}),
	cookieParser(),
];

const applyMiddlewares = (consumer: MiddlewareConsumer) => consumer
	.apply(JwtCookieMiddleware)
	.forRoutes({ path: '*', method: RequestMethod.ALL });

const AppProviders = [
	{
		provide: APP_GUARD,
		useClass: JwtAuthGuard,
	},
	{
		provide: APP_GUARD,
		useClass: RolesGuard,
	}
];

export {
	presetup, buildInterceptors, applyMiddlewares,
	buildPipes, buildExceptionFilters, buildHttpPlugs,
	AppProviders
};
