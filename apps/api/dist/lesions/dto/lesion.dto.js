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
exports.LesionDto = void 0;
const class_transformer_1 = require("class-transformer");
class LesionDto {
    id;
    episodeId;
    lesionNumber;
    segment;
    laterality;
    isTargetLesion;
    diameterAxialMm;
    diameterCraniocaudalMm;
    diameterApMm;
    calculatedVolumeCm3;
    lirads;
    notes;
    version;
    createdAt;
    updatedAt;
}
exports.LesionDto = LesionDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], LesionDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], LesionDto.prototype, "episodeId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], LesionDto.prototype, "lesionNumber", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], LesionDto.prototype, "segment", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], LesionDto.prototype, "laterality", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], LesionDto.prototype, "isTargetLesion", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], LesionDto.prototype, "diameterAxialMm", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], LesionDto.prototype, "diameterCraniocaudalMm", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], LesionDto.prototype, "diameterApMm", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], LesionDto.prototype, "calculatedVolumeCm3", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], LesionDto.prototype, "lirads", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], LesionDto.prototype, "notes", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], LesionDto.prototype, "version", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], LesionDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], LesionDto.prototype, "updatedAt", void 0);
