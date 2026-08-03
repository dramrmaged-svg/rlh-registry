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
exports.VocabularyController = void 0;
const common_1 = require("@nestjs/common");
const vocabulary_cache_service_1 = require("./vocabulary-cache.service");
// Not @Public(): vocabulary contents aren't sensitive, but this app defaults
// every route to requiring authentication (see AppModule's global guards)
// and there's no product need to break that pattern here — any
// authenticated role may read vocabularies, matching the no-@Roles()
// convention used by other read endpoints (e.g. PatientsController.list).
let VocabularyController = class VocabularyController {
    cache;
    constructor(cache) {
        this.cache = cache;
    }
    list() {
        return this.cache.list();
    }
    getByKey(key) {
        const vocab = this.cache.get(key);
        if (!vocab)
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: `Vocabulary '${key}' not found` });
        return vocab;
    }
};
exports.VocabularyController = VocabularyController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VocabularyController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VocabularyController.prototype, "getByKey", null);
exports.VocabularyController = VocabularyController = __decorate([
    (0, common_1.Controller)('vocabularies'),
    __metadata("design:paramtypes", [vocabulary_cache_service_1.VocabularyCacheService])
], VocabularyController);
