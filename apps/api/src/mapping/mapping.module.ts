import { Module } from '@nestjs/common';
import { MappingController } from './mapping.controller';
import { MappingService } from './mapping.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [MappingController],
  providers: [MappingService],
})
export class MappingModule {}
