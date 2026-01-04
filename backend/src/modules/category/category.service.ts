import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all categories for a user
   */
  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get a single category by ID
   */
  async findOne(id: string, userId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Create a new category
   */
  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    const { name, icon, color, type } = createCategoryDto;

    // Check if category name already exists for this user
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name,
      },
    });

    if (existing) {
      throw new ConflictException('A category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        userId,
        name,
        icon: icon || '📦',
        color: color || '#6366f1',
        type: type || 'expense',
        isDefault: false, // User-created categories are not default
      },
    });
  }

  /**
   * Update a category
   */
  async update(id: string, userId: string, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists and belongs to user
    const category = await this.findOne(id, userId);

    // Prevent updating default categories (optional - you can remove this)
    if (category.isDefault) {
      throw new ForbiddenException('Cannot update default categories');
    }

    // If updating name, check for duplicates
    if (updateCategoryDto.name) {
      const duplicate = await this.prisma.category.findFirst({
        where: {
          userId,
          name: updateCategoryDto.name,
          id: { not: id }, // Exclude current category
        },
      });

      if (duplicate) {
        throw new ConflictException('A category with this name already exists');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  /**
   * Delete a category
   */
  async remove(id: string, userId: string) {
    // Check if category exists and belongs to user
    const category = await this.findOne(id, userId);

    // Prevent deleting default categories (optional)
    if (category.isDefault) {
      throw new ForbiddenException('Cannot delete default categories');
    }

    // Check if category has expenses
    const expenseCount = await this.prisma.expense.count({
      where: { categoryId: id },
    });

    if (expenseCount > 0) {
      throw new ConflictException(
        `Cannot delete category with ${expenseCount} expense(s). Please reassign or delete the expenses first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}
