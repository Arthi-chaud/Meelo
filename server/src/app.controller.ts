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

import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Public } from "./authentication/roles/roles.decorators";
import SettingsService from "./settings/settings.service";

@ApiExcludeController()
@Controller()
export default class AppController {
	constructor(private readonly settingsService: SettingsService) {}
	@Get()
	@Public()
	welcome() {
		return {
			message:
				"Welcome to Meelo! To know more about the API, visit '/swagger'",
			version: this.settingsService.settingsValues.version,
		};
	}
}
