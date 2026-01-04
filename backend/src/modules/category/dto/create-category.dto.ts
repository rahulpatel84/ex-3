import { IsString, IsNotEmpty, IsOptional, IsEnum, Length, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @IsString()
  @IsOptional()
  @Length(1, 10)
  icon?: string; // Emoji or icon name

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #6366f1)' })
  color?: string;

  @IsEnum(['expense', 'income'])
  @IsOptional()
  type?: 'expense' | 'income';
}
