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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const followup_service_1 = require("./followup.service");
const create_follow_up_dto_1 = require("./dto/create-follow-up.dto");
const patch_follow_up_dto_1 = require("./dto/patch-follow-up.dto");
const CLINICAL_ROLES = [client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR];
let FollowUpController = class FollowUpController {
    followUpService;
    constructor(followUpService) {
        this.followUpService = followUpService;
    }
    listForEpisode(episodeId) {
        return this.followUpService.listForEpisode(episodeId);
    }
    create(episodeId, dto, currentUser, request) {
        return this.followUpService.create(episodeId, dto, currentUser, request);
    }
    getById(id) {
        return this.followUpService.getById(id);
    }
    patch(id, dto, currentUser, request) {
        return this.followUpService.patch(id, dto, currentUser, request);
    }
    remove(id, version, currentUser, request) {
        return this.followUpService.remove(id, version, currentUser, request);
    }
};
exports.FollowUpController = FollowUpController;
__decorate([
    (0, common_1.Get)('episodes/:episodeId/follow-ups'),
    __param(0, (0, common_1.Param)('episodeId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FollowUpController.prototype, "listForEpisode", null);
__decorate([
    (0, common_1.Post)('episodes/:episodeId/follow-ups'),
    (0, roles_decorator_1.Roles)(...CLINICAL_ROLES),
    __param(0, (0, common_1.Param)('episodeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_follow_up_dto_1.CreateFollowUpDto, Function, Object]),
    __metadata("design:returntype", void 0)
], FollowUpController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('follow-ups/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FollowUpController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)('follow-ups/:id'),
    (0, roles_decorator_1.Roles)(...CLINICAL_ROLES),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_follow_up_dto_1.PatchFollowUpDto, Function, Object]),
    __metadata("design:returntype", void 0)
], FollowUpController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)('follow-ups/:id'),
    (0, roles_decorator_1.Roles)(...CLINICAL_ROLES),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('version', common_1.ParseIntPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Function, Object]),
    __metadata("design:returntype", void 0)
], FollowUpController.prototype, "remove", null);
exports.FollowUpController = FollowUpController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [followup_service_1.FollowUpService])
], FollowUpController);
