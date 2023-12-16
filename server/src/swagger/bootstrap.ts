import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export default async function bootstrapSwagger(app: INestApplication) {
	const config = new DocumentBuilder()
		.setTitle("API Documentation")
		.addServer("/api", "API Path (for Production use)")
		.addServer("/", "Application Path (for Dev use)")
		.build();
	const document = SwaggerModule.createDocument(app, config);

	SwaggerModule.setup("/swagger", app, document, {
		customSiteTitle: "Swagger - Meelo",
		swaggerOptions: {
			tagsSorter: "alpha",
			operationsSorter: "alpha",
		},
	});
}
