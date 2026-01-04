import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('categories')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  /**
   * GET /categories
   * Get all categories for the authenticated user
   */
  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    const categories = await this.categoryService.findAll(userId);

    return {
      success: true,
      data: categories,
    };
  }

  /**
   * GET /categories/:id
   * Get a single category by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const category = await this.categoryService.findOne(id, userId);

    return {
      success: true,
      data: category,
    };
  }

  /**
   * POST /categories
   * Create a new category
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: any) {
    const userId = req.user.id;
    const category = await this.categoryService.create(userId, createCategoryDto);

    return {
      success: true,
      message: 'Category created successfully',
      data: category,
    };
  }

  /**
   * PUT /categories/:id
   * Update a category
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const category = await this.categoryService.update(id, userId, updateCategoryDto);

    return {
      success: true,
      message: 'Category updated successfully',
      data: category,
    };
  }

  /**
   * DELETE /categories/:id
   * Delete a category
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    await this.categoryService.remove(id, userId);

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }
}
