import { Module } from '@nestjs/common';
import { ChestXrayAiController } from './chest-xray-ai.controller';
import { ChestXrayAiService } from './chest-xray-ai.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ChestXrayAiController],
  providers: [ChestXrayAiService],
})
export class ChestXrayAiModule {}
