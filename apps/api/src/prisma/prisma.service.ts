import { Injectable, OnModuleInit, OnModuleDestroy, Logger, InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApiException } from '../common/filters/global-exception.filter';

export type PrismaTx = Prisma.TransactionClient;
export type TransactionIsolation = 'repeatable-read' | 'read-committed' | 'serializable';

const SOFT_DELETE_FILTERABLE_ACTIONS = new Set(['findFirst','findFirstOrThrow','findMany','count','aggregate','groupBy']);
const SOFT_DELETABLE_MODELS = new Set(['Patient','MdtRecord','Procedure','FollowUp','ToxicityEvent']);
const MAX_CONFLICT_RETRIES = 3;

function conflictRetryDelayMs(attempt: number): number {
  const base = 50 * Math.pow(2, attempt);
  return Math.round(base + base * 0.25 * (Math.random() * 2 - 1));
}

function isConflictError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ log: process.env.NODE_ENV === 'development' ? [{ emit: 'stdout', level: 'error' }] : [{ emit: 'stdout', level: 'error' }] });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected');
    this.$use(async (params, next) => {
      const model = params.model as string | undefined;
      if (model && SOFT_DELETABLE_MODELS.has(model) && SOFT_DELETE_FILTERABLE_ACTIONS.has(params.action)) {
        if (!params.args) params.args = {};
        if (!params.args.where) params.args.where = {};
        if (!Object.prototype.hasOwnProperty.call(params.args.where, 'deletedAt')) params.args.where.deletedAt = null;
      }
      return next(params);
    });
  }

  async onModuleDestroy(): Promise<void> { await this.$disconnect(); }

  async withinTransaction<T>(fn: (tx: PrismaTx) => Promise<T>, isolation: TransactionIsolation = 'repeatable-read'): Promise<T> {
    const options = {
      'read-committed': { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5000, timeout: 10000 },
      'repeatable-read': { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5000, timeout: 10000 },
      'serializable': { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15000 },
    }[isolation];
        for (let attempt = 0; attempt <= MAX_CONFLICT_RETRIES; attempt++) {
      try { return await this.$transaction(fn, options); }
      catch (err) {
        if (isConflictError(err)) {
            if (attempt < MAX_CONFLICT_RETRIES) {
            await new Promise<void>((resolve) => setTimeout(resolve, conflictRetryDelayMs(attempt)));
            continue;
          }
          throw new ApiException(HttpStatus.CONFLICT, 'OPTIMISTIC_LOCK_CONFLICT', 'This record was modified by another user. Please refresh and reapply your changes.');
        }
        throw err;
      }
    }
    throw new InternalServerErrorException('Unexpected exit from transaction retry loop');
  }
}
