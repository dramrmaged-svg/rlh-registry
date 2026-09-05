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
exports.CreateEpisodeDto = void 0;
const class_validator_1 = require("class-validator");
const EPISODE_TYPES = ['FIRST', 'REPEAT'];
class CreateEpisodeDto {
    firstOrRepeat;
    // The service layer is the authoritative guard: it always discards
    // previousEpisodeId for non-REPEAT episodes regardless of what's sent
    // here (see EpisodesService.create) — a value submitted alongside
    // firstOrRepeat !== 'REPEAT' is silently ignored, never persisted or
    // used for an ownership check.
    previousEpisodeId;
    referralDate;
    referralSource;
    referringClinicianOverride;
}
exports.CreateEpisodeDto = CreateEpisodeDto;
__decorate([
    (0, class_validator_1.IsIn)(EPISODE_TYPES),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateEpisodeDto.prototype, "firstOrRepeat", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.firstOrRepeat === 'REPEAT'),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEpisodeDto.prototype, "previousEpisodeId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEpisodeDto.prototype, "referralDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEpisodeDto.prototype, "referralSource", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEpisodeDto.prototype, "referringClinicianOverride", void 0);
