import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import * as Plugins from "../src/app.plugins";

export default async function SetupApp(
	module: TestingModule,
): Promise<INestApplication> {
	const app = module.createNestApplication();

	app.useGlobalFilters(...Plugins.buildExceptionFilters(app))
		.useGlobalPipes(...Plugins.buildPipes(app))
		.useGlobalInterceptors(...Plugins.buildInterceptors(app))
		.use(...Plugins.buildHttpPlugs(app));
	return app.init();
}
