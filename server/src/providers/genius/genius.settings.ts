import { ApiHideProperty } from "@nestjs/swagger";
import BaseProviderSettings from "../models/provider.base-settings";
import { IsDefined, IsString } from "class-validator";

export default class GeniusSettings extends BaseProviderSettings {
	@ApiHideProperty()
	@IsDefined()
	@IsString()
	apiKey: string;
}
