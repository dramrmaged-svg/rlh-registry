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
exports.TreatmentController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const treatment_service_1 = require("./treatment.service");
const create_treatment_session_dto_1 = require("./dto/create-treatment-session.dto");
const patch_treatment_session_dto_1 = require("./dto/patch-treatment-session.dto");
const create_dose_injection_dto_1 = require("./dto/create-dose-injection.dto");
const CLINICAL_ROLES = [client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR];
let TreatmentController = class TreatmentController {
    treatmentService;
    constructor(treatmentService) {
        this.treatmentService = treatmentService;
    }
    listForEpisode(episodeId) {
        return this.treatmentService.listForEpisode(episodeId);
    }
    create(episodeId, dto, currentUser, request) {
        return this.treatmentService.create(episodeId, dto, currentUser, request);
    }
    getById(id) {
        return this.treatmentService.getById(id);
    }
    patch(id, dto, currentUser, request) {
        return this.treatmentService.patch(id, dto, currentUser, request);
    }
    remove(id, version, currentUser, request) {
        return this.treatmentService.remove(id, version, currentUser, request);
    }
    listDoseInjections(id) {
        return this.treatmentService.listDoseInjections(id);
    }
    createDoseInjection(id, dto, currentUser, request) {
        return this.treatmentService.createDoseInjection(id, dto, currentUser, request);
    }
};
exports.TreatmentController = TreatmentController;
__decorate([
    (0, common_1.Get)('episodes/:episodeId/treatment-sessions'),
    __param(0, (0, common_1.Param)('episodeId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "listForEpisode", null);
__decorate([
    (0, common_1.Post)('episodes/:episodeId/treatment-sessions'),
    (0, roles_decorator_1.Roles)(...CLINICAL_ROLES),
    __param(0, (0, common_1.Param)('episodeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_treatment_session_dto_1.CreateTreatmentSessionDto, Function, Object]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('treatment-sessions/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)('treatment-sessions/:id'),
    (0, roles_decorator_1.Roles)(...CLINICAL_ROLES),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_treatment_session_dto_1.PatchTreatmentSessionDto, Function, Object]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)('treatment-sessions/:id'),
    (0, roles_decorator_1.Roles)(...CLINICAL_ROLES),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('version', common_1.ParseIntPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Function, Object]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('treatment-sessions/:id/dose-injections'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "listDoseInjections", null);
__decorate([
    (0, common_1.Post)('treatment-sessions/:id/dose-injections'),
    (0, roles_decorator_1.Roles)(...CLINICAL_ROLES),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_dose_injection_dto_1.CreateDoseInjectionDto, Function, Object]),
    __metadata("design:returntype", void 0)
], TreatmentController.prototype, "createDoseInjection", null);
exports.TreatmentController = TreatmentController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [treatment_service_1.TreatmentService])
], TreatmentController);
