import { Module } from '@nestjs/common';
import { ToxicityController } from './toxicity.controller';
import { ToxicityService } from './toxicity.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ToxicityController],
  providers: [ToxicityService],
})
export class ToxicityModule {}
