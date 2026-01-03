import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private configService: ConfigService) {}

  @Get()
  getRoot() {
    return {
      message: 'ExpenseAI API is running',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV'),
      endpoints: {
        api: '/api',
        auth: '/api/auth',
        health: '/api/health',
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('NODE_ENV'),
    };
  }
}
