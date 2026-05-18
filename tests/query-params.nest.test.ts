import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { ApiQueryParams } from '../src/query-params';

const API_PARAMETERS_METADATA = 'swagger/apiParameters';

describe('ApiQueryParams Nest compatibility', () => {
	it('registers Swagger query metadata on a method', () => {
		class TestController {
			findAll() {
				return null;
			}
		}

		const descriptor = Object.getOwnPropertyDescriptor(
			TestController.prototype,
			'findAll',
		);

		if (!descriptor) {
			throw new Error('Descriptor not found');
		}

		ApiQueryParams({
			type: 'object',
			required: ['query', 'nullableValue', 'enabled'],
			properties: {
				query: { type: 'string', description: 'Search text' },
				page: { type: 'integer', default: 0, description: 'Page index' },
				state: { type: 'string', enum: ['active', 'inactive'] },
				nullableValue: { type: ['string', 'null'], format: 'uuid' },
				enabled: { type: 'boolean', default: false },
			},
		})(TestController.prototype, 'findAll', descriptor);

		const parametersMetadata = Reflect.getMetadata(
			API_PARAMETERS_METADATA,
			descriptor.value,
		) as Array<Record<string, unknown>>;

		expect(parametersMetadata).toBeDefined();
		expect(parametersMetadata).toHaveLength(5);
		expect(parametersMetadata).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					in: 'query',
					name: 'query',
					required: true,
					schema: { type: 'string' },
				}),
				expect.objectContaining({
					in: 'query',
					name: 'page',
					required: false,
					schema: { type: 'integer', default: 0 },
				}),
				expect.objectContaining({
					in: 'query',
					name: 'state',
					required: false,
					schema: { type: 'string', enum: ['active', 'inactive'] },
				}),
				expect.objectContaining({
					in: 'query',
					name: 'nullableValue',
					required: true,
					schema: { type: 'string', nullable: true, format: 'uuid' },
				}),
				expect.objectContaining({
					in: 'query',
					name: 'enabled',
					required: false,
					schema: { type: 'boolean', default: false },
				}),
			]),
		);
	});
});
