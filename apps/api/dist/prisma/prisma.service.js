"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const global_exception_filter_1 = require("../common/filters/global-exception.filter");
const SOFT_DELETE_FILTERABLE_ACTIONS = new Set(['findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy']);
const SOFT_DELETABLE_MODELS = new Set(['Patient', 'Episode', 'MdtRecord', 'MappingSession', 'DosimetryPlan', 'TreatmentSession', 'FollowUp', 'ToxicityEvent', 'Lesion']);
const MAX_CONFLICT_RETRIES = 3;
function conflictRetryDelayMs(attempt) {
    const base = 50 * Math.pow(2, attempt);
    return Math.round(base + base * 0.25 * (Math.random() * 2 - 1));
}
function isConflictError(err) {
    return err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
}
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    constructor() {
        super({ log: process.env.NODE_ENV === 'development' ? [{ emit: 'stdout', level: 'error' }] : [{ emit: 'stdout', level: 'error' }] });
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.log('Prisma connected');
        this.$use(async (params, next) => {
            const model = params.model;
            if (model && SOFT_DELETABLE_MODELS.has(model) && SOFT_DELETE_FILTERABLE_ACTIONS.has(params.action)) {
                if (!params.args)
                    params.args = {};
                if (!params.args.where)
                    params.args.where = {};
                if (!Object.prototype.hasOwnProperty.call(params.args.where, 'deletedAt'))
                    params.args.where.deletedAt = null;
            }
            return next(params);
        });
    }
    async onModuleDestroy() { await this.$disconnect(); }
    async withinTransaction(fn, isolation = 'repeatable-read') {
        const options = {
            'read-committed': { isolationLevel: client_1.Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5000, timeout: 10000 },
            'repeatable-read': { isolationLevel: client_1.Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 5000, timeout: 10000 },
            'serializable': { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15000 },
        }[isolation];
        for (let attempt = 0; attempt <= MAX_CONFLICT_RETRIES; attempt++) {
            try {
                return await this.$transaction(fn, options);
            }
            catch (err) {
                if (isConflictError(err)) {
                    if (attempt < MAX_CONFLICT_RETRIES) {
                        await new Promise((resolve) => setTimeout(resolve, conflictRetryDelayMs(attempt)));
                        continue;
                    }
                    throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'OPTIMISTIC_LOCK_CONFLICT', 'This record was modified by another user. Please refresh and reapply your changes.');
                }
                throw err;
            }
        }
        throw new common_1.InternalServerErrorException('Unexpected exit from transaction retry loop');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
