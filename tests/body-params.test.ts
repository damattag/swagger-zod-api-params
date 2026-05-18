import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const { apiBodyMock } = vi.hoisted(() => ({
	apiBodyMock: vi.fn((options: unknown) => options),
}));

vi.mock('@nestjs/swagger', () => ({
	ApiBody: apiBodyMock,
}));

import { ApiBodyParams } from '../src/body-params';

describe('ApiBodyParams', () => {
	beforeEach(() => {
		apiBodyMock.mockClear();
	});

	it('creates ApiBody decorator from an OpenAPI object schema', () => {
		ApiBodyParams({
			type: 'object',
			required: ['query', 'nullableValue', 'enabled'],
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

		expect(apiBodyMock).toHaveBeenCalledTimes(1);
		expect(apiBodyMock).toHaveBeenCalledWith({
			schema: {
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
						type: 'string',
						nullable: true,
						format: 'uuid',
					},
					enabled: {
						type: 'boolean',
						default: false,
					},
				},
			},
		});
	});

	it('throws when a property schema is boolean', () => {
		expect(() =>
			ApiBodyParams({
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
				name: z.string().min(1).describe('Name'),
				status: z.enum(['active', 'inactive']).describe('Filter status').optional(),
				page: z.number().int().default(1).describe('Page number'),
			});

			const jsonSchema = z.toJSONSchema(zodSchema);

			ApiBodyParams(jsonSchema);

			expect(apiBodyMock).toHaveBeenCalledTimes(1);

			const options = apiBodyMock.mock.calls[0]?.[0] as {
				schema: {
					type?: string;
					required?: string[];
					properties?: Record<string, Record<string, unknown>>;
				};
			};

			expect(options.schema.type).toBe('object');
			expect(options.schema.required).toEqual(['name']);
			expect(options.schema.properties?.name).toMatchObject({
				type: 'string',
				description: 'Name',
			});
			expect(options.schema.properties?.status).toMatchObject({
				type: 'string',
				enum: ['active', 'inactive'],
				description: 'Filter status',
			});
			expect(options.schema.properties?.page).toMatchObject({
				type: 'integer',
				default: 1,
				description: 'Page number',
			});
		});
	});
});
