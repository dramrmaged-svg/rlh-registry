import { Module } from '@nestjs/common';
import { MdtController } from './mdt.controller';
import { MdtService } from './mdt.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [MdtController],
  providers: [MdtService],
})
export class MdtModule {}
