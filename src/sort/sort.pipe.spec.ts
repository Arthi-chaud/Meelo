import type { ArgumentMetadata } from "@nestjs/common";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import { InvalidSortingFieldException, InvalidSortingOrderException, MissingSortingFieldException } from "./sort.exceptions";
import ParseSortParameterPipe from "./sort.pipe";

describe("Parse Sorting Parameter Pipe", () => {
	const pipe = new ParseSortParameterPipe(AlbumQueryParameters.AvalableFields);
	const metadata: ArgumentMetadata = { type: 'custom' };
	it("should parse the sorting parameter", () => {
		const request = { sortBy: 'name', order: 'desc' };
		expect(pipe.transform(request, metadata)).toStrictEqual({
			'name': 'desc'
		});
	});

	it("should parse the sorting parameter (implicit order)", () => {
		const request = { sortBy: 'id' };
		expect(pipe.transform(request, metadata)).toStrictEqual({
			'id': 'asc'
		});
	});

	it("should throw, as the 'sortBy' value was not given, but the order was", () => {
		const request = { order: 'desc'};
		expect(() => pipe.transform(request, metadata)).toThrow(MissingSortingFieldException);
	});

	it("should return empty sorting parameters", () => {
		const request = {};
		expect(pipe.transform(request, metadata)).toStrictEqual({});
	});

	it("should return an error, as the value of 'sortBy' is not correct", () => {
		const request = { sortBy: 'desc' };
		expect(() => pipe.transform(request, metadata)).toThrow(InvalidSortingFieldException);
	});

	it("should return an error, as the value of 'order' is not correct", () => {
		const request = { sortBy: 'name', order: 'troll' };
		expect(() => pipe.transform(request, metadata)).toThrow(InvalidSortingOrderException);
	});
})