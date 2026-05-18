import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const { applyDecoratorsMock, apiParamMock } = vi.hoisted(() => ({
	applyDecoratorsMock: vi.fn((...decorators: unknown[]) => decorators),
	apiParamMock: vi.fn((options: unknown) => options),
}));

vi.mock('@nestjs/common', () => ({
	applyDecorators: applyDecoratorsMock,
}));

vi.mock('@nestjs/swagger', () => ({
	ApiParam: apiParamMock,
}));

import { ApiPathParams } from '../src/path-params';

describe('ApiPathParams', () => {
	beforeEach(() => {
		applyDecoratorsMock.mockClear();
		apiParamMock.mockClear();
	});

	it('creates ApiParam decorators from an OpenAPI object schema', () => {
		ApiPathParams({
			type: 'object',
			required: ['id', 'nullableValue'],
			properties: {
				id: {
					type: 'string',
					description: 'Resource id',
				},
				version: {
					type: 'integer',
					description: 'Resource version',
				},
				state: {
					type: 'string',
					enum: ['active', 'inactive'],
				},
				nullableValue: {
					type: ['string', 'null'],
					format: 'uuid',
				},
			},
		});

		expect(apiParamMock).toHaveBeenCalledTimes(4);
		expect(apiParamMock).toHaveBeenNthCalledWith(1, {
			name: 'id',
			required: true,
			description: 'Resource id',
			schema: {
				type: 'string',
			},
		});
		expect(apiParamMock).toHaveBeenNthCalledWith(2, {
			name: 'version',
			required: false,
			description: 'Resource version',
			schema: {
				type: 'integer',
			},
		});
		expect(apiParamMock).toHaveBeenNthCalledWith(3, {
			name: 'state',
			required: false,
			schema: {
				type: 'string',
				enum: ['active', 'inactive'],
			},
		});
		expect(apiParamMock).toHaveBeenNthCalledWith(4, {
			name: 'nullableValue',
			required: true,
			schema: {
				type: 'string',
				nullable: true,
				format: 'uuid',
			},
		});

		expect(applyDecoratorsMock).toHaveBeenCalledTimes(1);
		expect(applyDecoratorsMock).toHaveBeenCalledWith(
			...apiParamMock.mock.results.map((result) => result.value),
		);
	});

	it('throws when a property schema is boolean', () => {
		expect(() =>
			ApiPathParams({
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
				id: z.uuid().describe('Resource id'),
				version: z.number().int().optional().describe('Resource version'),
			});

			const jsonSchema = z.toJSONSchema(zodSchema);

			ApiPathParams(jsonSchema);

			expect(apiParamMock).toHaveBeenCalledTimes(2);
			expect(apiParamMock).toHaveBeenNthCalledWith(1, {
				name: 'id',
				required: true,
				description: 'Resource id',
				schema: {
					type: 'string',
					format: 'uuid',
				},
			});
			expect(apiParamMock).toHaveBeenNthCalledWith(2, {
				name: 'version',
				required: false,
				description: 'Resource version',
				schema: {
					type: 'integer',
				},
			});
		});
	});
});
