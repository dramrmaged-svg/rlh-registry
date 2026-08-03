import { Module } from '@nestjs/common';
import { LesionsController } from './lesions.controller';
import { LesionsService } from './lesions.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [LesionsController],
  providers: [LesionsService],
})
export class LesionsModule {}
