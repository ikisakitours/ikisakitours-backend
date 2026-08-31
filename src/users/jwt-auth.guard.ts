import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    //const token = this.extractTokenFromHeader(request);
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Access token missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      // Attach the decoded user payload to the request object
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  //private extractTokenFromHeader(request: Request): string | undefined {
  //  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  //  return type === 'Bearer' ? token : undefined;
  //}

  private extractToken(request: Request): string | undefined {
    if (request.cookies && request.cookies.token) {
      return request.cookies.token;
    }
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

}