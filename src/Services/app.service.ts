import { Injectable, Req, Res } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {

    return 'Hello World!';
  }
  greet(): string {
    return "Sister i dey greet oh"
  }
}
