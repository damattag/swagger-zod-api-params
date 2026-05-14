# nest-swagger-zod

[![npm version](https://img.shields.io/npm/v/nest-swagger-zod.svg)](https://www.npmjs.com/package/nest-swagger-zod)
[![license](https://img.shields.io/npm/l/nest-swagger-zod.svg)](./LICENSE)

A NestJS decorator library that generates Swagger `@ApiQuery` decorators automatically from your [Zod](https://zod.dev) schemas.

## Installation

```bash
npm install nest-swagger-zod
```

### Peer Dependencies

Make sure the following packages are installed in your project:

```bash
npm install @nestjs/common @nestjs/swagger zod
```

## Usage

Define your query params as a Zod schema, convert it to JSON Schema, and pass it to `ApiQueryParams`:

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiQueryParams } from 'nest-swagger-zod';
import { z } from 'zod';

const SearchSchema = z.object({
  page: z.number().int().default(1).describe('Page number'),
  limit: z.number().int().max(100).default(20).describe('Items per page'),
  status: z.enum(['active', 'inactive']).optional().describe('Filter by status'),
});

@Controller('items')
export class ItemsController {
  @Get()
  @ApiQueryParams(z.toJSONSchema(SearchSchema))
  findAll(@Query() query: z.infer<typeof SearchSchema>) {
    // ...
  }
}
```

This will automatically register all Zod schema fields as `@ApiQuery` parameters in your Swagger UI.

## API

### `ApiQueryParams(jsonSchema: JSONSchema)`

A method decorator that reads the `properties` of a JSON Schema object and applies an `@ApiQuery` decorator for each property.

- Required fields are inferred from the schema's `required` array.
- Fields with a `default` value are marked as optional in Swagger.
- Supports `description`, `enum`, `format`, and `default` schema properties.

## License

ISC © [Guilherme da Matta](https://github.com/damattag)
