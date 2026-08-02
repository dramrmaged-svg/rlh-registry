import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CachedVocabularyOption {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CachedVocabulary {
  key: string;
  label: string;
  options: CachedVocabularyOption[];
}

/**
 * Eagerly loads all Vocabulary/VocabularyOption rows into memory at app
 * boot. Backs the synchronous @IsVocabularyCode() validator and
 * GET /vocabularies/:key. Refresh only happens at boot in this phase — there
 * is no admin UI to edit vocabulary options yet, so runtime cache
 * invalidation is an explicit, documented non-goal (see
 * docs/adr/0001-episode-architecture.md), not an oversight.
 */
@Injectable()
export class VocabularyCacheService implements OnModuleInit {
  private readonly logger = new Logger(VocabularyCacheService.name);
  private cache = new Map<string, CachedVocabulary>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const vocabularies = await this.prisma.vocabulary.findMany({
      where: { isActive: true },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });
    const next = new Map<string, CachedVocabulary>();
    for (const v of vocabularies) {
      next.set(v.key, {
        key: v.key,
        label: v.label,
        options: v.options.map((o) => ({ code: o.code, label: o.label, sortOrder: o.sortOrder, isActive: o.isActive })),
      });
    }
    this.cache = next;
    this.logger.log(`Vocabulary cache loaded: ${next.size} vocabularies`);
  }

  get(key: string): CachedVocabulary | undefined {
    return this.cache.get(key);
  }

  isValidCode(key: string, code: string): boolean {
    const vocab = this.cache.get(key);
    if (!vocab) return false;
    return vocab.options.some((o) => o.code === code && o.isActive);
  }

  list(): CachedVocabulary[] {
    return Array.from(this.cache.values());
  }
}
