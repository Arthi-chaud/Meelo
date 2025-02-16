import { build, $ } from "bun";

await $`rm -rf dist`;

const optionalRequirePackages = [
	"class-transformer",
	"class-validator",
	"@nestjs/microservices",
	"@nestjs/websockets",
	"@fastify/static",
	"class-transformer/storage",
	"nock",
	"aws-sdk",
	"mock-aws-s3", 
	"@grpc/grpc-js",
	"@grpc/proto-loader",
	"kafkajs", "nats", "ioredis", "mqtt"
];

const result = await build({
	entrypoints: ["./src/main.ts"],
	outdir: "./dist",
	target: "bun",
	minify: {
		syntax: true,
		whitespace: true,
	},
	external: optionalRequirePackages.filter((pkg) => {
		try {
			require(pkg);
			return false;
		} catch (_) {
			return true;
		}
	}),
	splitting: true,
});

if (!result.success) {
	console.log(result.logs[0]);
	process.exit(1);
}

console.log("Built successfully!");
