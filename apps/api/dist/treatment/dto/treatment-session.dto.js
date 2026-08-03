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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentSessionDto = void 0;
const class_transformer_1 = require("class-transformer");
class TreatmentSessionDto {
    id;
    episodeId;
    dosimetryPlanId;
    sessionDate;
    sessionNumber;
    status;
    accessRoute;
    accessSite;
    catheterType;
    fluoroTimeMin;
    dapGyCm2;
    contrastVolumeMl;
    embolicMaterial;
    particleProduct;
    administeredActivityGbq;
    maaBalanceCheckedAtDelivery;
    complications;
    operatorUserId;
    lockStatus;
    version;
    createdAt;
    updatedAt;
}
exports.TreatmentSessionDto = TreatmentSessionDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], TreatmentSessionDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], TreatmentSessionDto.prototype, "episodeId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "dosimetryPlanId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], TreatmentSessionDto.prototype, "sessionDate", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], TreatmentSessionDto.prototype, "sessionNumber", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "accessRoute", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "accessSite", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "catheterType", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "fluoroTimeMin", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "dapGyCm2", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "contrastVolumeMl", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "embolicMaterial", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "particleProduct", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "administeredActivityGbq", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "maaBalanceCheckedAtDelivery", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "complications", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], TreatmentSessionDto.prototype, "operatorUserId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], TreatmentSessionDto.prototype, "lockStatus", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], TreatmentSessionDto.prototype, "version", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], TreatmentSessionDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], TreatmentSessionDto.prototype, "updatedAt", void 0);
