// src/users/admin-api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-admin-key'];

    const validApiKey = process.env.ADMIN_API_KEY;

    if (!validApiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid or missing Admin API Key');
    }

    return true;
  }
}