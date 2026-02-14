import "dotenv/config";
import type { PrismaConfig } from "prisma";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "yarn run prisma db seed",
	},
	datasource: {
		url: process.env.DATABASE_URL!,
	},
} satisfies PrismaConfig);
