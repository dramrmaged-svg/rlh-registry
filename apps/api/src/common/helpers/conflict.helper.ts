import { HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiException } from '../filters/global-exception.filter';

export function throwOptimisticLockConflict(opts: {
  entityType: string;
  entityId: string;
  submittedVersion: number;
  currentVersion: number | undefined;
}): never {
  throw new ApiException(
    HttpStatus.CONFLICT,
    'OPTIMISTIC_LOCK_CONFLICT',
    'This record was modified by another user. Please refresh and reapply your changes.',
    opts,
  );
}

export function throwNotFound(entityType: string, entityId: string): never {
  throw new NotFoundException({
    code: 'NOT_FOUND',
    message: `${entityType} not found`,
    details: { entityId },
  });
}
