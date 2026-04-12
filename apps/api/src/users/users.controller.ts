import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import type { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get() @Roles(Role.ADMIN)
  list(@Query('isActive') isActive?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.list({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':userId') @Roles(Role.ADMIN)
  getById(@Param('userId', ParseUUIDPipe) userId: string) { return this.usersService.findById(userId); }

  @Post() @Roles(Role.ADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: UserResponseDto) {
    return this.usersService.create(dto, currentUser.id);
  }

  @Patch(':userId') @Roles(Role.ADMIN)
  patch(@Param('userId', ParseUUIDPipe) userId: string, @Body() dto: PatchUserDto) {
    return this.usersService.patch(userId, dto);
  }
}
