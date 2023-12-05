import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Public } from "./authentication/roles/public.decorator";

@ApiExcludeController()
@Controller()
export default class AppController {
	@Get()
	@Public()
	welcome() {
		return {
			message: "Welcome to Meelo! To know more about the API, visit '/swagger'"
		};
	}
}
