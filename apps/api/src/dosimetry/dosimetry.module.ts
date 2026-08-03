import { Module } from '@nestjs/common';
import { DosimetryController } from './dosimetry.controller';
import { DosimetryService } from './dosimetry.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [DosimetryController],
  providers: [DosimetryService],
})
export class DosimetryModule {}
