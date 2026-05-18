# nest-swagger-zod

[![npm version](https://img.shields.io/npm/v/nest-swagger-zod.svg)](https://www.npmjs.com/package/nest-swagger-zod)
[![license](https://img.shields.io/npm/l/nest-swagger-zod.svg)](./LICENSE)
[![tests](https://img.shields.io/badge/tests-passing-brightgreen)](./tests)
[![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./coverage)

A NestJS decorator library that generates Swagger `@ApiQuery`, `@ApiParam`, and `@ApiBody` decorators from OpenAPI-compatible object schemas. It remains compatible with schemas produced by [Zod](https://zod.dev).

## Installation

```bash
npm install nest-swagger-zod
```

### Peer Dependencies

Make sure the following packages are installed in your project:

```bash
npm install @nestjs/common @nestjs/swagger
```

## Usage

Pass an OpenAPI-compatible object schema to `ApiQueryParams`:

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiQueryParams, OpenApiObjectSchema } from 'nest-swagger-zod';

const SearchSchema: OpenApiObjectSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', default: 1, description: 'Page number' },
    limit: { type: 'integer', default: 20, description: 'Items per page' },
    status: {
      type: 'string',
      enum: ['active', 'inactive'],
      description: 'Filter by status',
    },
  },
};

@Controller('items')
export class ItemsController {
  @Get()
  @ApiQueryParams(SearchSchema)
  findAll(@Query() query: Record<string, unknown>) {
    // ...
  }
}
```

This will automatically register all schema fields as `@ApiQuery` parameters in your Swagger UI.

You can also apply the same schema directly to request bodies with `ApiBodyParams`:

```typescript
import { ApiBodyParams, OpenApiObjectSchema } from 'nest-swagger-zod';

const CreateItemSchema: OpenApiObjectSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', description: 'Item name' },
    status: { type: ['string', 'null'], enum: ['active', 'inactive'] },
  },
};

@Post()
@ApiBodyParams(CreateItemSchema)
create(@Body() body: Record<string, unknown>) {
  // ...
}
```

For route params, use `ApiPathParams`:

```typescript
import { ApiPathParams, OpenApiObjectSchema } from 'nest-swagger-zod';

const PathSchema: OpenApiObjectSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid', description: 'Item id' },
    version: { type: 'integer', description: 'Version number' },
  },
};

@Get(':id/:version')
@ApiPathParams(PathSchema)
findOne(@Param() params: Record<string, unknown>) {
  // ...
}
```

If you already use Zod, you can keep using `z.toJSONSchema(...)` and pass the result directly.

## API

### `ApiQueryParams(jsonSchema: OpenApiObjectSchema)`

A method decorator that reads the `properties` of a JSON Schema object and applies an `@ApiQuery` decorator for each property.

- Required fields are inferred from the schema's `required` array.
- Fields with a `default` value are marked as optional in Swagger.
- Supports `description`, `enum`, `format`, and `default` schema properties.

### `ApiBodyParams(jsonSchema: OpenApiObjectSchema)`

A method decorator that applies the full object schema as an `@ApiBody` schema.

- Preserves schema metadata while normalizing nullable union types (`['type', 'null']`) into `type + nullable: true`.
- Keeps required fields from the schema, excluding fields that have a `default` value.

### `ApiPathParams(jsonSchema: OpenApiObjectSchema)`

A method decorator that reads the `properties` of a JSON Schema object and applies an `@ApiParam` decorator for each property.

- Required fields are inferred from the schema's `required` array.
- Supports `description`, `enum`, and `format` schema properties.

## License

ISC © [Guilherme da Matta](https://github.com/damattag)
