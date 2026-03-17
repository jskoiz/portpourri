import {
  Controller,
  Delete,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService, type AuthResult } from './auth.service';
import { SignupDto, LoginDto, RegisterPushTokenDto } from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('signup')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiCreatedResponse({ description: 'User account created successfully.' })
  @ApiTooManyRequestsResponse({ description: 'Signup rate limit exceeded.' })
  async signup(@Body() signUpDto: SignupDto): Promise<AuthResult> {
    return this.authService.signup(signUpDto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user and return tokens' })
  @ApiOkResponse({ description: 'User logged in successfully.' })
  @ApiTooManyRequestsResponse({ description: 'Login rate limit exceeded.' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResult> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the authenticated user profile' })
  @ApiOkResponse({ description: 'Current user profile returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getCurrentUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete the authenticated account' })
  @ApiNoContentResponse({ description: 'Account deleted successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async deleteAccount(@Request() req: AuthenticatedRequest): Promise<void> {
    await this.authService.deleteAccount(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('push-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register an Expo push token for the authenticated user' })
  @ApiNoContentResponse({ description: 'Push token registered successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async registerPushToken(
    @Request() req: AuthenticatedRequest,
    @Body() body: RegisterPushTokenDto,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: req.user.id },
      data: { pushToken: body.token },
    });
  }
}
