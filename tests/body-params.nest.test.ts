import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { ApiBodyParams } from '../src/body-params';

const API_PARAMETERS_METADATA = 'swagger/apiParameters';

describe('ApiBodyParams Nest compatibility', () => {
	it('registers Swagger body metadata on a method', () => {
		class TestController {
			create() {
				return null;
			}
		}

		const descriptor = Object.getOwnPropertyDescriptor(
			TestController.prototype,
			'create',
		);

		if (!descriptor) {
			throw new Error('Descriptor not found');
		}

		ApiBodyParams({
			type: 'object',
			required: ['name'],
			properties: {
				name: { type: 'string' },
				status: { type: ['string', 'null'], enum: ['active', 'inactive'] },
			},
		})(TestController.prototype, 'create', descriptor);

		const parametersMetadata = Reflect.getMetadata(
			API_PARAMETERS_METADATA,
			descriptor.value,
		) as Array<Record<string, unknown>>;

		expect(parametersMetadata).toBeDefined();
		expect(parametersMetadata).toHaveLength(1);
		expect(parametersMetadata[0]).toMatchObject({
			in: 'body',
			required: true,
			schema: {
				type: 'object',
				required: ['name'],
				properties: {
					name: { type: 'string' },
					status: {
						type: 'string',
						nullable: true,
						enum: ['active', 'inactive'],
					},
				},
			},
		});
	});
});
