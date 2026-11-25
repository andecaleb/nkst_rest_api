import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';

@Module({
  controllers: [PostsController, AnnouncementsController],
  providers: [PostsService, AnnouncementsService],
  exports: [PostsService, AnnouncementsService],
})
export class CommunicationModule {}
