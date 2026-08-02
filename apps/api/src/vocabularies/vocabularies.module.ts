import { Module, OnModuleInit } from '@nestjs/common';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyCacheService } from './vocabulary-cache.service';
import { registerVocabularyCacheService } from './decorators/is-vocabulary-code.decorator';

@Module({
  controllers: [VocabularyController],
  providers: [VocabularyCacheService],
  exports: [VocabularyCacheService],
})
export class VocabulariesModule implements OnModuleInit {
  constructor(private readonly cache: VocabularyCacheService) {}

  onModuleInit(): void {
    registerVocabularyCacheService(this.cache);
  }
}
