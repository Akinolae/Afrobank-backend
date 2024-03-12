import { Controller, Get, Post, HttpCode, Req, Res } from '@nestjs/common';
import { AuthService } from '../Services/auth.service';

@Controller('auth')
class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Req() req, @Res() res): any {
    return this.authService.register(req, res)
  }

  @Post("login")
  login(@Req() req, @Res() res): any {
    return this.authService.login(req, res)
  }
}

export { AuthController };
