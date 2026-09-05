import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { VocabularyCacheService } from './vocabulary-cache.service';

// Not @Public(): vocabulary contents aren't sensitive, but this app defaults
// every route to requiring authentication (see AppModule's global guards)
// and there's no product need to break that pattern here — any
// authenticated role may read vocabularies, matching the no-@Roles()
// convention used by other read endpoints (e.g. PatientsController.list).
@Controller('vocabularies')
export class VocabularyController {
  constructor(private readonly cache: VocabularyCacheService) {}

  @Get()
  list() {
    return this.cache.list();
  }

  @Get(':key')
  getByKey(@Param('key') key: string) {
    const vocab = this.cache.get(key);
    if (!vocab) throw new NotFoundException({ code: 'NOT_FOUND', message: `Vocabulary '${key}' not found` });
    return vocab;
  }
}
