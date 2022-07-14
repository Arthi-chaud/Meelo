import { INestApplication, ValidationPipe } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import MeeloExceptionFilter from "src/exceptions/meelo-exception.filter";
import NotFoundExceptionFilter from "src/exceptions/not-found.exception";

export default async function SetupApp(module: TestingModule): Promise<INestApplication> {
	let app = module.createNestApplication();
	app.useGlobalFilters(
		new NotFoundExceptionFilter(),
		new MeeloExceptionFilter()
	);
	app.useGlobalPipes(new ValidationPipe());
	return await app.init();
}