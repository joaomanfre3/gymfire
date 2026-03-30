import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExercisesModule } from './exercises/exercises.module';
import { FoldersModule } from './folders/folders.module';
import { RoutinesModule } from './routines/routines.module';
import { PointsModule } from './points/points.module';
import { StreakModule } from './streak/streak.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { SocialModule } from './social/social.module';
import { FeedModule } from './feed/feed.module';
import { RankingModule } from './ranking/ranking.module';
import { ChatModule } from './chat/chat.module';
import { SpeedsModule } from './speeds/speeds.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PremiumModule } from './premium/premium.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ExercisesModule,
    FoldersModule,
    RoutinesModule,
    PointsModule,
    StreakModule,
    WorkoutsModule,
    SocialModule,
    FeedModule,
    RankingModule,
    ChatModule,
    SpeedsModule,
    NotificationsModule,
    PremiumModule,
  ],
})
export class AppModule {}
