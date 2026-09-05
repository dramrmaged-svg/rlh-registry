"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeDecimals = serializeDecimals;
const client_1 = require("@prisma/client");
/**
 * class-transformer's plainToInstance(), when a property has no explicit
 * @Type() decorator and its source value isn't a plain Object, falls back to
 * `new value.constructor()` to guess a container type (see
 * TransformOperationExecutor.transform in class-transformer@0.5.1). Prisma's
 * Decimal throws when constructed with no arguments ("Invalid argument:
 * undefined"), so any DTO exposing a raw Decimal field without @Type()
 * crashes at serialization time. Converting Decimal instances to strings
 * before plainToInstance sidesteps this entirely and matches the `string |
 * null` wire type already declared on every Decimal-backed DTO field.
 */
function serializeDecimals(record) {
    const result = { ...record };
    for (const key of Object.keys(result)) {
        const value = result[key];
        if (value instanceof client_1.Prisma.Decimal) {
            result[key] = value.toString();
        }
    }
    return result;
}
