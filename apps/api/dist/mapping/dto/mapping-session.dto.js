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
exports.MappingSessionDto = void 0;
const class_transformer_1 = require("class-transformer");
class MappingSessionDto {
    id;
    episodeId;
    sessionDate;
    status;
    accessRoute;
    accessSite;
    catheterType;
    fluoroTimeMin;
    dapGyCm2;
    contrastVolumeMl;
    michelsAnatomy;
    embolicMaterial;
    complications;
    operatorUserId;
    lockStatus;
    version;
    createdAt;
    updatedAt;
}
exports.MappingSessionDto = MappingSessionDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MappingSessionDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MappingSessionDto.prototype, "episodeId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], MappingSessionDto.prototype, "sessionDate", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "accessRoute", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "accessSite", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "catheterType", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "fluoroTimeMin", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "dapGyCm2", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "contrastVolumeMl", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "michelsAnatomy", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "embolicMaterial", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "complications", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MappingSessionDto.prototype, "operatorUserId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MappingSessionDto.prototype, "lockStatus", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], MappingSessionDto.prototype, "version", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], MappingSessionDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], MappingSessionDto.prototype, "updatedAt", void 0);
