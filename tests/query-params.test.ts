import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const { applyDecoratorsMock, apiQueryMock } = vi.hoisted(() => ({
	applyDecoratorsMock: vi.fn((...decorators: unknown[]) => decorators),
	apiQueryMock: vi.fn((options: unknown) => options),
}));

vi.mock('@nestjs/common', () => ({
	applyDecorators: applyDecoratorsMock,
}));

vi.mock('@nestjs/swagger', () => ({
	ApiQuery: apiQueryMock,
}));

import { ApiQueryParams } from '../src/query-params';

describe('ApiQueryParams', () => {
	beforeEach(() => {
		applyDecoratorsMock.mockClear();
		apiQueryMock.mockClear();
	});

	it('creates ApiQuery decorators from an OpenAPI object schema', () => {
		ApiQueryParams({
			type: 'object',
			required: ['query', 'nullableValue'],
			properties: {
				query: {
					type: 'string',
					description: 'Search text',
				},
				page: {
					type: 'integer',
					default: 0,
					description: 'Page index',
				},
				state: {
					type: 'string',
					enum: ['active', 'inactive'],
				},
				nullableValue: {
					type: ['string', 'null'],
					format: 'uuid',
				},
				enabled: {
					type: 'boolean',
					default: false,
				},
			},
		});

		expect(apiQueryMock).toHaveBeenCalledTimes(5);
		expect(apiQueryMock).toHaveBeenNthCalledWith(1, {
			name: 'query',
			required: true,
			description: 'Search text',
			schema: {
				type: 'string',
			},
		});
		expect(apiQueryMock).toHaveBeenNthCalledWith(2, {
			name: 'page',
			required: false,
			description: 'Page index',
			schema: {
				type: 'integer',
				default: 0,
			},
		});
		expect(apiQueryMock).toHaveBeenNthCalledWith(3, {
			name: 'state',
			required: false,
			schema: {
				type: 'string',
				enum: ['active', 'inactive'],
			},
		});
		expect(apiQueryMock).toHaveBeenNthCalledWith(4, {
			name: 'nullableValue',
			required: true,
			schema: {
				type: 'string',
				nullable: true,
				format: 'uuid',
			},
		});
		expect(apiQueryMock).toHaveBeenNthCalledWith(5, {
			name: 'enabled',
			required: false,
			schema: {
				type: 'boolean',
				default: false,
			},
		});

		expect(applyDecoratorsMock).toHaveBeenCalledTimes(1);
		expect(applyDecoratorsMock).toHaveBeenCalledWith(
			...apiQueryMock.mock.results.map((result) => result.value),
		);
	});

	it('throws when a property schema is boolean', () => {
		expect(() =>
			ApiQueryParams({
				type: 'object',
				properties: {
					invalid: true,
				},
			}),
		).toThrow('Boolean properties are not supported');
	});

	describe('Zod compatibility', () => {
		it('accepts a Zod generated JSON schema', () => {
			const zodSchema = z.object({
				page: z.number().int().default(1).describe('Page number'),
				limit: z.number().int().max(100).default(20).describe('Items per page'),
				status: z
					.enum(['active', 'inactive'])
					.optional()
					.describe('Filter status'),
			});

			const jsonSchema = z.toJSONSchema(zodSchema);

			ApiQueryParams(jsonSchema);

			expect(apiQueryMock).toHaveBeenCalledTimes(3);
			expect(apiQueryMock).toHaveBeenNthCalledWith(1, {
				name: 'page',
				required: false,
				description: 'Page number',
				schema: {
					type: 'integer',
					default: 1,
				},
			});
			expect(apiQueryMock).toHaveBeenNthCalledWith(2, {
				name: 'limit',
				required: false,
				description: 'Items per page',
				schema: {
					type: 'integer',
					default: 20,
				},
			});
			expect(apiQueryMock).toHaveBeenNthCalledWith(3, {
				name: 'status',
				required: false,
				description: 'Filter status',
				schema: {
					type: 'string',
					enum: ['active', 'inactive'],
				},
			});
		});

		it('marks Zod required fields as required when no default exists', () => {
			const zodSchema = z.object({
				query: z.string().min(1).describe('Search query'),
				createdAt: z.iso.datetime().describe('Creation timestamp'),
			});

			const jsonSchema = z.toJSONSchema(zodSchema);

			ApiQueryParams(jsonSchema);

			expect(apiQueryMock).toHaveBeenCalledTimes(2);
			expect(apiQueryMock).toHaveBeenNthCalledWith(1, {
				name: 'query',
				required: true,
				description: 'Search query',
				schema: {
					type: 'string',
				},
			});
			expect(apiQueryMock).toHaveBeenNthCalledWith(2, {
				name: 'createdAt',
				required: true,
				description: 'Creation timestamp',
				schema: {
					type: 'string',
					format: 'date-time',
				},
			});
		});

		it('uses Zod defaults while preserving enum values', () => {
			const zodSchema = z.object({
				sort: z.enum(['asc', 'desc']).default('asc').describe('Sort order'),
				enabled: z.boolean().default(true).describe('Enabled flag'),
			});

			const jsonSchema = z.toJSONSchema(zodSchema);

			ApiQueryParams(jsonSchema);

			expect(apiQueryMock).toHaveBeenCalledTimes(2);
			expect(apiQueryMock).toHaveBeenNthCalledWith(1, {
				name: 'sort',
				required: false,
				description: 'Sort order',
				schema: {
					type: 'string',
					enum: ['asc', 'desc'],
					default: 'asc',
				},
			});
			expect(apiQueryMock).toHaveBeenNthCalledWith(2, {
				name: 'enabled',
				required: false,
				description: 'Enabled flag',
				schema: {
					type: 'boolean',
					default: true,
				},
			});
		});
	});
});
