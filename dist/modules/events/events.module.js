"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsModule = void 0;
const common_1 = require("@nestjs/common");
const groups_controller_1 = require("./groups/groups.controller");
const groups_service_1 = require("./groups/groups.service");
const gallery_controller_1 = require("./gallery/gallery.controller");
const gallery_service_1 = require("./gallery/gallery.service");
const resources_controller_1 = require("./resources/resources.controller");
const resources_service_1 = require("./resources/resources.service");
const marketplace_controller_1 = require("./marketplace/marketplace.controller");
const marketplace_service_1 = require("./marketplace/marketplace.service");
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            groups_controller_1.GroupsController,
            gallery_controller_1.GalleryController,
            resources_controller_1.ResourcesController,
            marketplace_controller_1.MarketplaceController,
        ],
        providers: [groups_service_1.GroupsService, gallery_service_1.GalleryService, resources_service_1.ResourcesService, marketplace_service_1.MarketplaceService],
        exports: [groups_service_1.GroupsService, gallery_service_1.GalleryService, resources_service_1.ResourcesService, marketplace_service_1.MarketplaceService],
    })
], EventsModule);
//# sourceMappingURL=events.module.js.map