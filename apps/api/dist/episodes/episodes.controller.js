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
exports.EpisodesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const episodes_service_1 = require("./episodes.service");
const create_episode_dto_1 = require("./dto/create-episode.dto");
const patch_episode_dto_1 = require("./dto/patch-episode.dto");
const episode_transition_dto_1 = require("./dto/episode-transition.dto");
const resume_episode_dto_1 = require("./dto/resume-episode.dto");
const duplicate_episode_dto_1 = require("./dto/duplicate-episode.dto");
let EpisodesController = class EpisodesController {
    episodesService;
    constructor(episodesService) {
        this.episodesService = episodesService;
    }
    listForPatient(patientId) {
        return this.episodesService.listForPatient(patientId);
    }
    create(patientId, dto, currentUser, request) {
        return this.episodesService.create(patientId, dto, currentUser, request);
    }
    getById(id) {
        return this.episodesService.getById(id);
    }
    patch(id, dto, currentUser, request) {
        return this.episodesService.patch(id, dto, currentUser, request);
    }
    transition(id, dto, currentUser, request) {
        return this.episodesService.transition(id, dto, currentUser, request);
    }
    resume(id, dto, currentUser, request) {
        return this.episodesService.resume(id, dto, currentUser, request);
    }
    duplicate(id, dto, currentUser, request) {
        return this.episodesService.duplicate(id, dto, currentUser, request);
    }
    timeline(id) {
        return this.episodesService.timeline(id);
    }
};
exports.EpisodesController = EpisodesController;
__decorate([
    (0, common_1.Get)('patients/:patientId/episodes'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EpisodesController.prototype, "listForPatient", null);
__decorate([
    (0, common_1.Post)('patients/:patientId/episodes'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_episode_dto_1.CreateEpisodeDto, Function, Object]),
    __metadata("design:returntype", void 0)
], EpisodesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('episodes/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EpisodesController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)('episodes/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_episode_dto_1.PatchEpisodeDto, Function, Object]),
    __metadata("design:returntype", void 0)
], EpisodesController.prototype, "patch", null);
__decorate([
    (0, common_1.Post)('episodes/:id/transition'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, episode_transition_dto_1.EpisodeTransitionDto, Function, Object]),
    __metadata("design:returntype", void 0)
], EpisodesController.prototype, "transition", null);
__decorate([
    (0, common_1.Post)('episodes/:id/resume'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, resume_episode_dto_1.ResumeEpisodeDto, Function, Object]),
    __metadata("design:returntype", void 0)
], EpisodesController.prototype, "resume", null);
__decorate([
    (0, common_1.Post)('episodes/:id/duplicate'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, duplicate_episode_dto_1.DuplicateEpisodeDto, Function, Object]),
    __metadata("design:returntype", void 0)
], EpisodesController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Get)('episodes/:id/timeline'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EpisodesController.prototype, "timeline", null);
exports.EpisodesController = EpisodesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [episodes_service_1.EpisodesService])
], EpisodesController);
