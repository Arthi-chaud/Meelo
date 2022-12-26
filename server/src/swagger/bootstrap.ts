import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export default async function bootstrapSwagger(app: INestApplication) {
	const config = new DocumentBuilder()
		.setTitle('Meelo')
		.setDescription('API Documentation')
		.addServer("/api", "API Path (for Production use)")
		.addServer("/", "Application Path (for Dev use)")
		.build();
	const document = SwaggerModule.createDocument(app, config,);

	SwaggerModule.setup('/docs', app, document, {
		customSiteTitle: 'Swagger - Meelo',
		customfavIcon: './favicon.ico',
		customCssUrl: './swagger/styles.css',
		customJs: './swagger/script.js'
	});
}
