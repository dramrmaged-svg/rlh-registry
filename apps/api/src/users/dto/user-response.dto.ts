import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose() id!: string;
  @Expose() email!: string;
  @Expose() firstName!: string;
  @Expose() lastName!: string;
  @Expose() title!: string | null;
  @Expose() gmcNumber!: string | null;
  @Expose() role!: string;
  @Expose() isActive!: boolean;
  @Expose() version!: number;
  @Expose() lastLoginAt!: Date | null;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
