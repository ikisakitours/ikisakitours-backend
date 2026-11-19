import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard (Zero-Trust Suspension)', () => {
  let guard: JwtAuthGuard;
  let mockJwtService: any;
  let mockDb: any;

  beforeEach(() => {
    mockJwtService = {
      verifyAsync: jest.fn(),
    };
    mockDb = {
      query: {
        users: {
          findFirst: jest.fn(),
        },
      },
    };
    guard = new JwtAuthGuard(mockJwtService, mockDb);
  });

  const createMockContext = (headers: Record<string, string> = {}, cookies: Record<string, string> = {}): ExecutionContext => {
    const request: any = { headers, cookies };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  it('should throw UnauthorizedException when no token is present', async () => {
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token signature is invalid', async () => {
    const context = createMockContext({ authorization: 'Bearer invalid-token' });
    mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user does not exist in database', async () => {
    const context = createMockContext({ authorization: 'Bearer valid-token' });
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-uuid' });
    mockDb.query.users.findFirst.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException (ACCOUNT_SUSPENDED) when user.hasAccess is false', async () => {
    const context = createMockContext({ authorization: 'Bearer valid-token' });
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-uuid' });
    mockDb.query.users.findFirst.mockResolvedValue({
      id: 'user-uuid',
      email: 'suspended@example.com',
      firstName: 'Pramod',
      lastName: 'Siriwardhana',
      hasAccess: false,
    });

    try {
      await guard.canActivate(context);
      fail('Expected guard to throw ForbiddenException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ForbiddenException);
      const res = err.getResponse();
      expect(res).toEqual({
        statusCode: 403,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account access has been restricted by administration.',
        user: {
          id: 'user-uuid',
          email: 'suspended@example.com',
          firstname: 'Pramod',
          lastname: 'Siriwardhana',
          hasAccess: false,
        },
      });
    }
  });

  it('should allow access and attach user to request when user.hasAccess is true', async () => {
    const request: any = { headers: { authorization: 'Bearer valid-token' } };
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-uuid' });
    mockDb.query.users.findFirst.mockResolvedValue({
      id: 'user-uuid',
      email: 'active@example.com',
      firstName: 'Pramod',
      lastName: 'Siriwardhana',
      hasAccess: true,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request.user).toEqual({
      id: 'user-uuid',
      sub: 'user-uuid',
      email: 'active@example.com',
      firstName: 'Pramod',
      lastName: 'Siriwardhana',
      hasAccess: true,
    });
  });
});
