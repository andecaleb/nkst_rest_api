import { Module } from '@nestjs/common';
import { GroupsController } from './groups/groups.controller';
import { GroupsService } from './groups/groups.service';
import { GalleryController } from './gallery/gallery.controller';
import { GalleryService } from './gallery/gallery.service';
import { ResourcesController } from './resources/resources.controller';
import { ResourcesService } from './resources/resources.service';
import { MarketplaceController } from './marketplace/marketplace.controller';
import { MarketplaceService } from './marketplace/marketplace.service';

@Module({
  controllers: [
    GroupsController,
    GalleryController,
    ResourcesController,
    MarketplaceController,
  ],
  providers: [GroupsService, GalleryService, ResourcesService, MarketplaceService],
  exports: [GroupsService, GalleryService, ResourcesService, MarketplaceService],
})
export class EventsModule {}
