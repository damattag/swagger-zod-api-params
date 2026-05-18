import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { ApiPathParams } from '../src/path-params';

const API_PARAMETERS_METADATA = 'swagger/apiParameters';

describe('ApiPathParams Nest compatibility', () => {
	it('registers Swagger path metadata on a method', () => {
		class TestController {
			findOne() {
				return null;
			}
		}

		const descriptor = Object.getOwnPropertyDescriptor(
			TestController.prototype,
			'findOne',
		);

		if (!descriptor) {
			throw new Error('Descriptor not found');
		}

		ApiPathParams({
			type: 'object',
			required: ['id', 'nullableValue'],
			properties: {
				id: { type: 'string' },
				version: { type: 'integer' },
				nullableValue: { type: ['string', 'null'], format: 'uuid' },
			},
		})(TestController.prototype, 'findOne', descriptor);

		const parametersMetadata = Reflect.getMetadata(
			API_PARAMETERS_METADATA,
			descriptor.value,
		) as Array<Record<string, unknown>>;

		expect(parametersMetadata).toBeDefined();
		expect(parametersMetadata).toHaveLength(3);
		expect(parametersMetadata).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string' },
				}),
				expect.objectContaining({
					in: 'path',
					name: 'version',
					required: false,
					schema: { type: 'integer' },
				}),
				expect.objectContaining({
					in: 'path',
					name: 'nullableValue',
					required: true,
					schema: { type: 'string', nullable: true, format: 'uuid' },
				}),
			]),
		);
	});
});
