import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  private async getUserHouseholdId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentHouseholdId: true },
    });
    return user?.currentHouseholdId || null;
  }

  async findAll(userId: string, filters?: { startDate?: string; endDate?: string; type?: string; categoryId?: string; includeDeleted?: string; personal?: string; householdId?: string }) {
    let where: any = {};
    
    if (filters?.personal === 'true') {
      // Personal mode: Only show user's own expenses
      where.userId = userId;
    } else if (filters?.householdId) {
      // Specific household mode: Show expenses for a specific household
      // Verify user is a member of this household
      const membership = await this.prisma.householdMember.findUnique({
        where: {
          householdId_userId: {
            householdId: filters.householdId,
            userId,
          },
        },
      });
      if (!membership || membership.status !== 'active') {
        throw new ForbiddenException('You are not a member of this household');
      }
      where.householdId = filters.householdId;
    } else {
      // Default: Use user's current household or personal expenses
      const householdId = await this.getUserHouseholdId(userId);
      where = householdId ? { householdId } : { userId };
    }

    // By default, exclude deleted expenses unless specifically requested
    if (filters?.includeDeleted !== 'true') {
      where.deletedAt = null;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    return this.prisma.expense.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        deletedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        household: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Check if user has access (either their own expense or in the household)
    const householdId = await this.getUserHouseholdId(userId);
    if (expense.userId !== userId && expense.householdId !== householdId) {
      throw new ForbiddenException('You do not have permission to access this expense');
    }

    return expense;
  }

  async create(userId: string, createExpenseDto: CreateExpenseDto) {
    const householdId = await this.getUserHouseholdId(userId);

    // Verify category exists and is accessible (either user's category or household's category)
    const category = await this.prisma.category.findUnique({
      where: { id: createExpenseDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category belongs to user's household or directly to user
    if (householdId && category.householdId !== householdId) {
      throw new ForbiddenException('You do not have permission to use this category');
    } else if (!householdId && category.userId !== userId) {
      throw new ForbiddenException('You do not have permission to use this category');
    }

    // Create expense with current date if not provided
    const expense = await this.prisma.expense.create({
      data: {
        userId,
        householdId,
        categoryId: createExpenseDto.categoryId,
        amount: createExpenseDto.amount,
        description: createExpenseDto.description,
        notes: createExpenseDto.notes,
        date: createExpenseDto.date ? new Date(createExpenseDto.date) : new Date(),
        type: createExpenseDto.type,
        paymentMethod: createExpenseDto.paymentMethod,
        receiptUrl: createExpenseDto.receiptUrl,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        household: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return expense;
  }

  async update(id: string, userId: string, updateExpenseDto: UpdateExpenseDto) {
    // Check if expense exists and user has access
    const expense = await this.findOne(id, userId);
    const householdId = await this.getUserHouseholdId(userId);

    // If updating category, verify it exists and is accessible
    if (updateExpenseDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateExpenseDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Check if category belongs to user's household or directly to user
      if (householdId && category.householdId !== householdId) {
        throw new ForbiddenException('You do not have permission to use this category');
      } else if (!householdId && category.userId !== userId) {
        throw new ForbiddenException('You do not have permission to use this category');
      }
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        ...updateExpenseDto,
        date: updateExpenseDto.date ? new Date(updateExpenseDto.date) : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    // Check if expense exists and belongs to user
    await this.findOne(id, userId);

    // Soft delete: Set deletedAt and deletedBy instead of actually deleting
    await this.prisma.expense.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  // Find all deleted expenses for audit trail
  async findAllDeleted(userId: string) {
    const householdId = await this.getUserHouseholdId(userId);
    
    return this.prisma.expense.findMany({
      where: householdId ? {
        householdId,
        deletedAt: { not: null },
      } : {
        userId,
        deletedAt: { not: null },
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  // Analytics methods
  async getAnalytics(userId: string, startDate?: string, endDate?: string, personal?: string, householdIdParam?: string) {
    let where: any = { deletedAt: null }; // Exclude deleted expenses from analytics
    
    if (personal === 'true') {
      // Personal mode: Only user's own expenses
      where.userId = userId;
    } else if (householdIdParam) {
      // Specific household mode
      const membership = await this.prisma.householdMember.findUnique({
        where: {
          householdId_userId: {
            householdId: householdIdParam,
            userId,
          },
        },
      });
      if (!membership || membership.status !== 'active') {
        throw new ForbiddenException('You are not a member of this household');
      }
      where.householdId = householdIdParam;
    } else {
      // Default: Use user's current household or personal expenses
      const householdId = await this.getUserHouseholdId(userId);
      if (householdId) {
        where.householdId = householdId;
      } else {
        where.userId = userId;
      }
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Get totals
    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        category: true,
      },
    });

    const totalExpenses = expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalIncome = expenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const byCategory = expenses.reduce((acc, expense) => {
      const categoryName = expense.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: expense.category,
          total: 0,
          count: 0,
          expenses: [],
        };
      }
      acc[categoryName].total += expense.amount;
      acc[categoryName].count += 1;
      acc[categoryName].expenses.push(expense);
      return acc;
    }, {});

    // Group by payment method
    const byPaymentMethod = expenses.reduce((acc, expense) => {
      const method = expense.paymentMethod || 'unknown';
      if (!acc[method]) {
        acc[method] = {
          total: 0,
          count: 0,
        };
      }
      acc[method].total += expense.amount;
      acc[method].count += 1;
      return acc;
    }, {});

    // Group by date for trends
    const byDate = expenses.reduce((acc, expense) => {
      const date = expense.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          totalExpenses: 0,
          totalIncome: 0,
          count: 0,
        };
      }
      if (expense.type === 'expense') {
        acc[date].totalExpenses += expense.amount;
      } else {
        acc[date].totalIncome += expense.amount;
      }
      acc[date].count += 1;
      return acc;
    }, {});

    return {
      summary: {
        totalExpenses,
        totalIncome,
        netBalance: totalIncome - totalExpenses,
        totalTransactions: expenses.length,
      },
      byCategory: Object.values(byCategory),
      byPaymentMethod: Object.values(byPaymentMethod),
      byDate: Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date)),
    };
  }
}
