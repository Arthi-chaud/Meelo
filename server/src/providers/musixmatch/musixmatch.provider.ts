import { Injectable } from "@nestjs/common";
import IProvider from "../iprovider";
import MusixMatchSettings from "./musixmatch.settings";

@Injectable()
export default class MusixMatchProvider extends IProvider<MusixMatchSettings> {
	constructor() {
		super('musixmatch');
	}

	getProviderBannerUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Musixmatch_compact_logo_on_white.svg/566px-Musixmatch_compact_logo_on_white.svg.png";
	}

	getProviderIconUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Musixmatch_logo_icon_only.svg/480px-Musixmatch_logo_icon_only.svg.png";
	}
}
