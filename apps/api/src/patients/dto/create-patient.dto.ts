import { IsString, IsOptional, IsDateString, IsIn, IsNotEmpty, ValidateNested, ValidateIf, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

const IDENTIFIER_TYPES = ['NHS_NUMBER', 'MRN_RLH', 'MRN_EXTERNAL', 'EXTERNAL_REFERRAL_ID'] as const;
const SEX_VALUES = ['MALE', 'FEMALE', 'INDETERMINATE', 'UNKNOWN'] as const;

class PrimaryIdentifierDto {
  @IsIn(IDENTIFIER_TYPES) identifierType!: (typeof IDENTIFIER_TYPES)[number];
  @IsString() @IsNotEmpty() value!: string;
  @ValidateIf((o: PrimaryIdentifierDto) => o.identifierType === 'MRN_EXTERNAL') @IsString() @IsNotEmpty() issuingOrg?: string;
}

class DuplicateConfirmationDto {
  @IsString() @IsNotEmpty() token!: string;
  @IsInt() @Min(0) reviewedMatchCount!: number;
  @IsString() @IsNotEmpty() confirmationNote!: string;
}

export class CreatePatientDto {
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsDateString() dateOfBirth!: string;
  @IsIn(SEX_VALUES) sex!: (typeof SEX_VALUES)[number];
  @IsString() @IsOptional() ethnicity?: string;
  @IsString() @IsOptional() gpPractice?: string;
  @IsString() @IsOptional() referringHospital?: string;
  @ValidateNested() @Type(() => PrimaryIdentifierDto) @IsOptional() primaryIdentifier?: PrimaryIdentifierDto;
  @ValidateNested() @Type(() => DuplicateConfirmationDto) @IsOptional() duplicateConfirmation?: DuplicateConfirmationDto;
}
