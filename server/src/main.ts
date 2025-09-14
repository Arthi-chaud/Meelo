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

import { NestFactory } from "@nestjs/core";
import AppModule from "./app.module";
import * as Plugins from "./app.plugins";
import Logger from "./logger/logger";
import bootstrapSwagger from "./swagger/bootstrap";

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
	app.enableShutdownHooks();
	await app.listen(4000);
}
bootstrap();
