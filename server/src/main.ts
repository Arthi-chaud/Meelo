import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import AppModule from './app.module';
import MeeloExceptionFilter from './exceptions/meelo-exception.filter';
import NotFoundExceptionFilter from './exceptions/not-found.exception';
import mime from 'mime';
import { InvalidRequestException } from './exceptions/meelo-exception';
import AllExceptionsFilter from './exceptions/all-exceptions.filter';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bootstrapSwagger from './swagger/bootstrap';
import Logger from './logger/logger';

async function bootstrap() {
	mime.define({ 'audio/mpeg': ['m4a', mime.getExtension('audio/mpeg')!] }, true);
	const app = await NestFactory.create(AppModule, {
		cors: process.env.NODE_ENV === 'development'
	});
	const { httpAdapter } = app.get(HttpAdapterHost);

	app.useLogger(app.get(Logger));
	app.useGlobalFilters(
		new AllExceptionsFilter(httpAdapter),
		new NotFoundExceptionFilter(),
		new MeeloExceptionFilter()
	);
	app.useGlobalPipes(new ValidationPipe({
		transform: true,
		exceptionFactory: (error) => {
			const failedConstraint = Object.keys(error[0].constraints!)[0];

			return new InvalidRequestException(error[0].constraints![failedConstraint]);
		},
		transformOptions: {
			enableImplicitConversion: true
		},
	}));
	app.use(helmet({
		crossOriginResourcePolicy: process.env.NODE_ENV === 'development'
			? { policy: 'cross-origin' }
			: true
	}));
	app.use(cookieParser());
	await bootstrapSwagger(app);
	await app.listen(4000);
}
bootstrap();
