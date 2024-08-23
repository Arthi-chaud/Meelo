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

import { Controller, Get, HttpStatus, Redirect } from "@nestjs/common";
import type Settings from "./models/settings";
import SettingsService from "./settings.service";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Admin } from "src/authentication/roles/roles.decorators";

@Admin()
@ApiTags("Settings")
@Controller("settings")
export default class SettingsController {
	constructor(private settingsService: SettingsService) {}

	@Get()
	@ApiOperation({
		summary: "Get settings",
	})
	getSettings(): Settings {
		return this.settingsService.settingsValues;
	}

	@Get("reload")
	@ApiOperation({
		summary: "Reload settings",
	})
	@Redirect("/settings", HttpStatus.FOUND)
	reload() {
		this.settingsService.loadFromFile();
	}
}
