import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MdtService } from './mdt.service';
import { CreateMdtRecordDto } from './dto/create-mdt-record.dto';
import { PatchMdtRecordDto } from './dto/patch-mdt-record.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import { IsString } from 'class-validator';

class UnlockBodyDto { @IsString() reason!: string; }

@Controller()
export class MdtController {
  constructor(private readonly mdtService: MdtService) {}

  @Get('patients/:patientId/mdt-records')
  listForPatient(@Param('patientId', ParseUUIDPipe) patientId: string, @CurrentUser() currentUser: UserResponseDto) {
    return this.mdtService.listForPatient(patientId, currentUser.role);
  }

  @Post('patients/:patientId/mdt-records') @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR)
  create(@Param('patientId', ParseUUIDPipe) patientId: string, @Body() dto: CreateMdtRecordDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.mdtService.create(patientId, dto, currentUser, request);
  }

  @Get('mdt-records/:id')
  getRecord(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: UserResponseDto) {
    return this.mdtService.getRecord(id, currentUser.role);
  }

  @Patch('mdt-records/:id') @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR)
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchMdtRecordDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.mdtService.patch(id, dto, currentUser, request);
  }

  @Post('mdt-records/:id/submit') @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR)
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.mdtService.submit(id, currentUser, request);
  }

  @Post('mdt-records/:id/lock') @Roles(Role.ADMIN, Role.CONSULTANT_IR)
  lock(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.mdtService.lock(id, currentUser, request);
  }

  @Post('mdt-records/:id/unlock') @Roles(Role.ADMIN)
  unlock(@Param('id', ParseUUIDPipe) id: string, @Body() body: UnlockBodyDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.mdtService.unlock(id, body.reason, currentUser, request);
  }
}
