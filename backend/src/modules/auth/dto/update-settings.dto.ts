import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  @Length(3, 3, { message: 'Currency code must be 3 characters (e.g., USD, EUR, GBP)' })
  currencyCode?: string;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  fullName?: string;
}

