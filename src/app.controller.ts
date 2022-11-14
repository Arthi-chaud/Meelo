import { Controller, Get, Post } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";

@ApiExcludeController()
@Controller()
export default class AppController {
	@Get()
	welcome() {
		return {
			"message": "Welcome to Meelo! To know more about the API, visit '/docs'"
		}
	}
}