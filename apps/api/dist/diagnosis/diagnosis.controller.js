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
exports.DiagnosisController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const diagnosis_service_1 = require("./diagnosis.service");
const create_diagnosis_dto_1 = require("./dto/create-diagnosis.dto");
const patch_diagnosis_dto_1 = require("./dto/patch-diagnosis.dto");
const recalculate_diagnosis_dto_1 = require("./dto/recalculate-diagnosis.dto");
const CLINICAL_ROLES = [client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR];
let DiagnosisController = class DiagnosisController {
    diagnosisService;
    constructor(diagnosisService) {
        this.diagnosisService = diagnosisService;
    }
    getForEpisode(episodeId) {
        return this.diagnosisService.getForEpisode(episodeId);
    }
    create(episodeId, dto, currentUser, request) {
        return this.diagnosisService.create(episodeId, dto, currentUser, request);
    }
    patch(episodeId, dto, currentUser, request) {
        return this.diagnosisService.patch(episodeId, dto, currentUser, request);
    }
    recalculate(episodeId, dto, currentUser, request) {
        return this.diagnosisService.recalculate(episodeId, dto, currentUser, request);
    }
};
exports.DiagnosisController = DiagnosisController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('episodeId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DiagnosisController.prototype, "getForEpisode", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(...CLINICAL_ROLES),
    __param(0, (0, common_1.Param)('episodeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_diagnosis_dto_1.CreateDiagnosisDto, Function, Object]),
    __metadata("design:returntype", void 0)
], DiagnosisController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(),
    (0, roles_decorator_1.Roles)(...CLINICAL_ROLES),
    __param(0, (0, common_1.Param)('episodeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_diagnosis_dto_1.PatchDiagnosisDto, Function, Object]),
    __metadata("design:returntype", void 0)
], DiagnosisController.prototype, "patch", null);
__decorate([
    (0, common_1.Post)('recalculate'),
    (0, roles_decorator_1.Roles)(...CLINICAL_ROLES),
    __param(0, (0, common_1.Param)('episodeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, recalculate_diagnosis_dto_1.RecalculateDiagnosisDto, Function, Object]),
    __metadata("design:returntype", void 0)
], DiagnosisController.prototype, "recalculate", null);
exports.DiagnosisController = DiagnosisController = __decorate([
    (0, common_1.Controller)('episodes/:episodeId/diagnosis'),
    __metadata("design:paramtypes", [diagnosis_service_1.DiagnosisService])
], DiagnosisController);
