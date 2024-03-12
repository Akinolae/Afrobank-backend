import { Controller, Get, Post, HttpCode, Req, Res } from '@nestjs/common';
import { AppService } from '../Services/app.service';

@Controller('user')
class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('greet')
  getHello(@Req() req, @Res() res): any {
    res.status(200).json({
      success: true,
      message: req.body,
    });

    // return this.appService.getHello();
  }

  @Post()
  postName(): any {
    return this.appService.greet();
  }
}

export { AppController };
