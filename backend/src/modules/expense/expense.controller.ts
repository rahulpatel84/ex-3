import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const expenses = await this.expenseService.findAll(req.user.id, {
      startDate,
      endDate,
      type,
      categoryId,
    });

    return {
      success: true,
      data: expenses,
    };
  }

  @Get('analytics')
  async getAnalytics(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const analytics = await this.expenseService.getAnalytics(req.user.id, startDate, endDate);

    return {
      success: true,
      data: analytics,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const expense = await this.expenseService.findOne(id, req.user.id);

    return {
      success: true,
      data: expense,
    };
  }

  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto, @Req() req: any) {
    const expense = await this.expenseService.create(req.user.id, createExpenseDto);

    return {
      success: true,
      message: 'Expense created successfully',
      data: expense,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Req() req: any,
  ) {
    const expense = await this.expenseService.update(id, req.user.id, updateExpenseDto);

    return {
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.expenseService.remove(id, req.user.id);

    return {
      success: true,
      message: 'Expense deleted successfully',
    };
  }
}
