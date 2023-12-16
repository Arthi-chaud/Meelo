import { NestFactory } from "@nestjs/core";
import AppModule from "./app.module";
import bootstrapSwagger from "./swagger/bootstrap";
import Logger from "./logger/logger";
import * as Plugins from "./app.plugins";

async function bootstrap() {
	Plugins.presetup();
	const app = await NestFactory.create(AppModule, {
		cors: process.env.NODE_ENV === "development",
		logger: new Logger(),
	});

	app.useGlobalFilters(...Plugins.buildExceptionFilters(app))
		.useGlobalPipes(...Plugins.buildPipes(app))
		.useGlobalInterceptors(...Plugins.buildInterceptors(app))
		.use(...Plugins.buildHttpPlugs(app));
	await bootstrapSwagger(app);
	await app.listen(4000);
}
bootstrap();
