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
import {
  SignupDto,
  LoginDto,
  RegisterPushTokenDto,
  GoogleLoginDto,
  AppleLoginDto,
} from './auth.dto';
import { OAuthService } from './oauth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
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

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @Post('google')
  @ApiOperation({ summary: 'Authenticate with Google' })
  @ApiOkResponse({ description: 'Google login successful.' })
  @ApiTooManyRequestsResponse({ description: 'Login rate limit exceeded.' })
  async loginWithGoogle(@Body() dto: GoogleLoginDto): Promise<AuthResult> {
    return this.oauthService.loginWithGoogle(dto.idToken);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @Post('apple')
  @ApiOperation({ summary: 'Authenticate with Apple' })
  @ApiOkResponse({ description: 'Apple login successful.' })
  @ApiTooManyRequestsResponse({ description: 'Login rate limit exceeded.' })
  async loginWithApple(@Body() dto: AppleLoginDto): Promise<AuthResult> {
    return this.oauthService.loginWithApple(dto.identityToken, dto.fullName);
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
    await this.authService.registerPushToken(req.user.id, body.token);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('push-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deregister the push token for the authenticated user' })
  @ApiNoContentResponse({ description: 'Push token deregistered successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async deregisterPushToken(
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.authService.deregisterPushToken(req.user.id);
  }
}
