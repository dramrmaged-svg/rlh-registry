import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { MdtModule } from './mdt/mdt.module';
import { EpisodesModule } from './episodes/episodes.module';
import { VocabulariesModule } from './vocabularies/vocabularies.module';
import { LesionsModule } from './lesions/lesions.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { MappingModule } from './mapping/mapping.module';
import { DosimetryModule } from './dosimetry/dosimetry.module';
import { TreatmentModule } from './treatment/treatment.module';
import { FollowUpModule } from './followup/followup.module';
import { ToxicityModule } from './toxicity/toxicity.module';
import { AuditModule } from './audit/audit.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    ThrottlerModule.forRoot([{ name: 'global', ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    MdtModule,
    EpisodesModule,
    VocabulariesModule,
    LesionsModule,
    DiagnosisModule,
    MappingModule,
    DosimetryModule,
    TreatmentModule,
    FollowUpModule,
    ToxicityModule,
    AuditModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
