import { Module } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { WorkoutsController } from './workouts.controller';
import { PointsModule } from '../points/points.module';
import { StreakModule } from '../streak/streak.module';

@Module({
  imports: [PointsModule, StreakModule],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
