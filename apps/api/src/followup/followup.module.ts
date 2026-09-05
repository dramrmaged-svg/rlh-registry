import { Module } from '@nestjs/common';
import { FollowUpController } from './followup.controller';
import { FollowUpService } from './followup.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [FollowUpController],
  providers: [FollowUpService],
})
export class FollowUpModule {}
