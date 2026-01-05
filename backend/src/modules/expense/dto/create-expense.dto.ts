import { IsString, IsNumber, IsOptional, IsDateString, IsIn, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  categoryId: string;

  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsIn(['expense', 'income'], { message: 'Type must be either expense or income' })
  type: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // e.g., 'cash', 'credit_card', 'debit_card', 'upi', 'bank_transfer'

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
