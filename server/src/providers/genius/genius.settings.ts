import { ApiHideProperty } from "@nestjs/swagger";
import BaseProviderSettings from "../models/provider.base-settings";
import { IsDefined, IsString } from "class-validator";
import { Exclude } from "class-transformer";

export default class GeniusSettings extends BaseProviderSettings {
	@ApiHideProperty()
	@IsDefined()
	@IsString()
	@Exclude({ toPlainOnly: true })
	apiKey: string;
}
