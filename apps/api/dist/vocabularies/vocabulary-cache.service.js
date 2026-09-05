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
var VocabularyCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabularyCacheService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
/**
 * Eagerly loads all Vocabulary/VocabularyOption rows into memory at app
 * boot. Backs the synchronous @IsVocabularyCode() validator and
 * GET /vocabularies/:key. Refresh only happens at boot in this phase — there
 * is no admin UI to edit vocabulary options yet, so runtime cache
 * invalidation is an explicit, documented non-goal (see
 * docs/adr/0001-episode-architecture.md), not an oversight.
 */
let VocabularyCacheService = VocabularyCacheService_1 = class VocabularyCacheService {
    prisma;
    logger = new common_1.Logger(VocabularyCacheService_1.name);
    cache = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        await this.refresh();
    }
    async refresh() {
        const vocabularies = await this.prisma.vocabulary.findMany({
            where: { isActive: true },
            include: { options: { orderBy: { sortOrder: 'asc' } } },
        });
        const next = new Map();
        for (const v of vocabularies) {
            next.set(v.key, {
                key: v.key,
                label: v.label,
                options: v.options.map((o) => ({ code: o.code, label: o.label, sortOrder: o.sortOrder, isActive: o.isActive })),
            });
        }
        this.cache = next;
        this.logger.log(`Vocabulary cache loaded: ${next.size} vocabularies`);
    }
    get(key) {
        return this.cache.get(key);
    }
    isValidCode(key, code) {
        const vocab = this.cache.get(key);
        if (!vocab)
            return false;
        return vocab.options.some((o) => o.code === code && o.isActive);
    }
    list() {
        return Array.from(this.cache.values());
    }
};
exports.VocabularyCacheService = VocabularyCacheService;
exports.VocabularyCacheService = VocabularyCacheService = VocabularyCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VocabularyCacheService);
