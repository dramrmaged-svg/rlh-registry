"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwOptimisticLockConflict = throwOptimisticLockConflict;
exports.throwNotFound = throwNotFound;
const common_1 = require("@nestjs/common");
const global_exception_filter_1 = require("../filters/global-exception.filter");
function throwOptimisticLockConflict(opts) {
    throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'OPTIMISTIC_LOCK_CONFLICT', 'This record was modified by another user. Please refresh and reapply your changes.', opts);
}
function throwNotFound(entityType, entityId) {
    throw new common_1.NotFoundException({
        code: 'NOT_FOUND',
        message: `${entityType} not found`,
        details: { entityId },
    });
}
