"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const user_response_dto_1 = require("./dto/user-response.dto");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const BCRYPT_ROUNDS = 12;
function toDto(user) {
    return (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, { excludeExtraneousValues: true });
}
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
        return toDto(user);
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return null;
        return toDto(user);
    }
    async create(dto, createdById) {
        const passwordHash = await bcrypt.hash(dto.temporaryPassword, BCRYPT_ROUNDS);
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException({ code: 'DUPLICATE_EMAIL', message: 'A user with this email address already exists' });
        try {
            const user = await this.prisma.user.create({
                data: { email: dto.email, firstName: dto.firstName, lastName: dto.lastName,
                    title: dto.title ?? null, gmcNumber: dto.gmcNumber ?? null, role: dto.role, passwordHash, createdById },
            });
            return toDto(user);
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
                throw new common_1.ConflictException({ code: 'DUPLICATE_EMAIL', message: 'A user with this email address already exists' });
            throw err;
        }
    }
    async patch(id, dto) {
        const existing = await this.prisma.user.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
        return this.prisma.withinTransaction(async (tx) => {
            const result = await tx.user.updateMany({
                where: { id, version: dto.version },
                data: {
                    ...(dto.firstName !== undefined && { firstName: dto.firstName }),
                    ...(dto.lastName !== undefined && { lastName: dto.lastName }),
                    ...(dto.title !== undefined && { title: dto.title }),
                    ...(dto.gmcNumber !== undefined && { gmcNumber: dto.gmcNumber }),
                    version: { increment: 1 },
                },
            });
            if (result.count === 0) {
                const current = await tx.user.findUnique({ where: { id }, select: { version: true } });
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'User', entityId: id, submittedVersion: dto.version, currentVersion: current?.version });
            }
            const fresh = await tx.user.findUnique({ where: { id } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('User', id);
            return toDto(fresh);
        });
    }
    async list(params) {
        const { isActive, limit = 50, page = 1 } = params;
        const skip = (page - 1) * limit;
        const where = { ...(isActive !== undefined && { isActive }) };
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({ where, skip, take: limit, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
            this.prisma.user.count({ where }),
        ]);
        return { data: users.map(u => toDto(u)), total };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
