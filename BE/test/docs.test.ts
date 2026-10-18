import test from "node:test";
import assert from "node:assert/strict";
import { openapi } from "../src/docs.js";

test("every OpenAPI success body has a schema and 204 responses have no body", () => {
  for (const [path, methods] of Object.entries(openapi.paths)) {
    for (const [method, raw] of Object.entries(methods)) {
      const operation = raw as { responses: Record<string, { content?: Record<string, { schema: unknown }> }> };
      for (const [status, response] of Object.entries(operation.responses)) {
        if (status === "204") assert.equal(response.content, undefined);
        else assert.ok(response.content?.["application/json"]?.schema, `${method} ${path} ${status}`);
      }
    }
  }
});
