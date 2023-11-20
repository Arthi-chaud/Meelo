import { ApiHideProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { IsDefined, IsString } from "class-validator";
import BaseProviderSettings from "../models/provider.base-settings";

export default class DiscogsSettings extends BaseProviderSettings {
	@ApiHideProperty()
	@IsDefined()
	@IsString()
	@Exclude({ toPlainOnly: true })
	apiKey: string;
}
