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
exports.VocabulariesModule = void 0;
const common_1 = require("@nestjs/common");
const vocabulary_controller_1 = require("./vocabulary.controller");
const vocabulary_cache_service_1 = require("./vocabulary-cache.service");
const is_vocabulary_code_decorator_1 = require("./decorators/is-vocabulary-code.decorator");
let VocabulariesModule = class VocabulariesModule {
    cache;
    constructor(cache) {
        this.cache = cache;
    }
    onModuleInit() {
        (0, is_vocabulary_code_decorator_1.registerVocabularyCacheService)(this.cache);
    }
};
exports.VocabulariesModule = VocabulariesModule;
exports.VocabulariesModule = VocabulariesModule = __decorate([
    (0, common_1.Module)({
        controllers: [vocabulary_controller_1.VocabularyController],
        providers: [vocabulary_cache_service_1.VocabularyCacheService],
        exports: [vocabulary_cache_service_1.VocabularyCacheService],
    }),
    __metadata("design:paramtypes", [vocabulary_cache_service_1.VocabularyCacheService])
], VocabulariesModule);
