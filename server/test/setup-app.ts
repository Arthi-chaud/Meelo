import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import MeeloExceptionFilter from "src/exceptions/meelo-exception.filter";
import NotFoundExceptionFilter from "src/exceptions/not-found.exception";
import cookieParser from "cookie-parser";
import { Reflector } from "@nestjs/core";

export default async function SetupApp(module: TestingModule): Promise<INestApplication> {
	const app = module.createNestApplication();
	app.useGlobalFilters(
		new NotFoundExceptionFilter(),
		new MeeloExceptionFilter()
	);
	app.use(cookieParser());
	app.useGlobalPipes(new ValidationPipe({
		transform: true,
		transformOptions: {
			enableImplicitConversion: true
		},
	}));
	app.useGlobalInterceptors(
		new ClassSerializerInterceptor(app.get(Reflector))
	);
	return app.init();
}