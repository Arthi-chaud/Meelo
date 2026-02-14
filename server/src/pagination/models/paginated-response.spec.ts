import InvalidPaginationParameterValue from "../pagination.exceptions";
import PaginatedResponse from "./paginated-response";

const fullItemsList = [...Array(99)].map((_, i) => ({ id: i + 1 }));
const baseRequest = {
	path: "/route",
};
describe("Paginated Response", () => {
	it("default page size, first page", () => {
		const request = {
			...baseRequest,
			query: {},
		};
		const response = new PaginatedResponse(
			fullItemsList.slice(0, 20),
			request,
		);
		expect(response.items.length).toStrictEqual(20);
		expect(response.metadata).toStrictEqual({
			page: 1,
			count: 20,
			this: "/route",
			next: "/route?skip=20",
			previous: null,
		});
	});

	it("default page size, second page", () => {
		const request = {
			...baseRequest,
			query: {
				skip: 20,
			},
		};
		const response = new PaginatedResponse(
			fullItemsList.slice(20, 40),
			request,
		);
		expect(response.items.length).toStrictEqual(20);
		expect(response.metadata).toStrictEqual({
			page: 2,
			count: 20,
			this: "/route?skip=20",
			next: "/route?skip=40",
			previous: "/route",
		});
	});

	it("default page size, third page", () => {
		const request = {
			...baseRequest,
			query: {
				skip: 40,
			},
		};
		const response = new PaginatedResponse(
			fullItemsList.slice(40, 60),
			request,
		);
		expect(response.items.length).toStrictEqual(20);
		expect(response.metadata).toStrictEqual({
			page: 3,
			count: 20,
			this: "/route?skip=40",
			next: "/route?skip=60",
			previous: "/route?skip=20",
		});
	});

	it("default page size, last page", () => {
		const request = {
			...baseRequest,
			query: {
				skip: 80,
			},
		};
		const response = new PaginatedResponse(
			fullItemsList.slice(80),
			request,
		);
		expect(response.items.length).toStrictEqual(19);
		expect(response.metadata).toStrictEqual({
			page: 5,
			count: 19,
			this: "/route?skip=80",
			next: null,
			previous: "/route?skip=60",
		});
	});

	it("default page size, truncated last page", () => {
		const request = {
			...baseRequest,
			query: {
				skip: 98,
			},
		};
		const response = new PaginatedResponse(
			fullItemsList.slice(98),
			request,
		);
		expect(response.items.length).toStrictEqual(1);
		expect(response.metadata).toStrictEqual({
			page: 5,
			count: 1,
			this: "/route?skip=98",
			next: null,
			previous: "/route?skip=80",
		});
	});

	it("page size = 10, first page", () => {
		const request = {
			...baseRequest,
			query: {
				take: 10,
			},
		};
		const response = new PaginatedResponse(
			fullItemsList.slice(0, 10),
			request,
		);
		expect(response.metadata).toStrictEqual({
			page: 1,
			count: 10,
			this: "/route?take=10",
			next: "/route?take=10&skip=10",
			previous: null,
		});
	});

	it("page size = 10, second page", () => {
		const request = {
			...baseRequest,
			query: {
				take: 10,
				skip: 10,
			},
		};
		const response = new PaginatedResponse(
			fullItemsList.slice(10, 20),
			request,
		);
		expect(response.metadata).toStrictEqual({
			page: 2,
			count: 10,
			this: "/route?take=10&skip=10",
			next: "/route?take=10&skip=20",
			previous: "/route?take=10",
		});
	});

	it("page size = 10, with afterId", () => {
		const request = {
			...baseRequest,
			query: {
				take: 10,
				afterId: 10,
			},
		};
		const response = new PaginatedResponse(
			fullItemsList.slice(10, 20),
			request,
		);
		expect(response.metadata).toStrictEqual({
			count: 10,
			this: "/route?take=10&afterId=10",
			next: "/route?take=10&afterId=20",
			previous: null,
			page: null,
		});
	});

	it("throw, as 'take' parameter is zero", () => {
		const request = {
			...baseRequest,
			query: {
				take: 0,
				skip: 10,
			},
		};
		const testResponse = () =>
			new PaginatedResponse(fullItemsList.slice(10, 20), request);
		expect(testResponse).toThrow(InvalidPaginationParameterValue);
	});
});
