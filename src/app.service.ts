import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Real-Time Vocabulary Quiz API is running!';
  }
}
