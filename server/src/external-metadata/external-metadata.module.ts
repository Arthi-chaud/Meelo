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

import { forwardRef, Module } from "@nestjs/common";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import ExternalMetadataController from "./external-metadata.controller";
import ExternalMetadataService from "./external-metadata.service";
import ProviderController from "./provider.controller";
import ProviderService from "./provider.service";

@Module({
	imports: [PrismaModule, forwardRef(() => IllustrationModule)],
	controllers: [ProviderController, ExternalMetadataController],
	providers: [ProviderService, ExternalMetadataService],
	exports: [ProviderService, ExternalMetadataService],
})
export class ExternalMetadataModule {}
