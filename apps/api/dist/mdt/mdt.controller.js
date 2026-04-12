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
exports.MdtController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const mdt_service_1 = require("./mdt.service");
const create_mdt_record_dto_1 = require("./dto/create-mdt-record.dto");
const patch_mdt_record_dto_1 = require("./dto/patch-mdt-record.dto");
const class_validator_1 = require("class-validator");
class UnlockBodyDto {
    reason;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnlockBodyDto.prototype, "reason", void 0);
let MdtController = class MdtController {
    mdtService;
    constructor(mdtService) {
        this.mdtService = mdtService;
    }
    listForPatient(patientId, currentUser) {
        return this.mdtService.listForPatient(patientId, currentUser.role);
    }
    create(patientId, dto, currentUser, request) {
        return this.mdtService.create(patientId, dto, currentUser, request);
    }
    getRecord(id, currentUser) {
        return this.mdtService.getRecord(id, currentUser.role);
    }
    patch(id, dto, currentUser, request) {
        return this.mdtService.patch(id, dto, currentUser, request);
    }
    submit(id, currentUser, request) {
        return this.mdtService.submit(id, currentUser, request);
    }
    lock(id, currentUser, request) {
        return this.mdtService.lock(id, currentUser, request);
    }
    unlock(id, body, currentUser, request) {
        return this.mdtService.unlock(id, body.reason, currentUser, request);
    }
};
exports.MdtController = MdtController;
__decorate([
    (0, common_1.Get)('patients/:patientId/mdt-records'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", void 0)
], MdtController.prototype, "listForPatient", null);
__decorate([
    (0, common_1.Post)('patients/:patientId/mdt-records'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_mdt_record_dto_1.CreateMdtRecordDto, Function, Object]),
    __metadata("design:returntype", void 0)
], MdtController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mdt-records/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", void 0)
], MdtController.prototype, "getRecord", null);
__decorate([
    (0, common_1.Patch)('mdt-records/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_mdt_record_dto_1.PatchMdtRecordDto, Function, Object]),
    __metadata("design:returntype", void 0)
], MdtController.prototype, "patch", null);
__decorate([
    (0, common_1.Post)('mdt-records/:id/submit'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR, client_1.Role.FELLOW, client_1.Role.CNS_COORDINATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function, Object]),
    __metadata("design:returntype", void 0)
], MdtController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)('mdt-records/:id/lock'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CONSULTANT_IR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function, Object]),
    __metadata("design:returntype", void 0)
], MdtController.prototype, "lock", null);
__decorate([
    (0, common_1.Post)('mdt-records/:id/unlock'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UnlockBodyDto, Function, Object]),
    __metadata("design:returntype", void 0)
], MdtController.prototype, "unlock", null);
exports.MdtController = MdtController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [mdt_service_1.MdtService])
], MdtController);
