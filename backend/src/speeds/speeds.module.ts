import { Module } from '@nestjs/common';
import { SpeedsService } from './speeds.service';
import { SpeedsController } from './speeds.controller';

@Module({
  controllers: [SpeedsController],
  providers: [SpeedsService],
  exports: [SpeedsService],
})
export class SpeedsModule {}
