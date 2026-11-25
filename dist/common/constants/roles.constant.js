"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NIGERIAN_STATES_LGAS = exports.REQUIRED_ACKNOWLEDGEMENTS = exports.UPLOAD_LIMITS = exports.DEFAULT_AVATAR_URL = exports.ROLES = void 0;
exports.ROLES = {
    VISITOR: 'VISITOR',
    MEMBER: 'MEMBER',
    GROUP_ADMIN: 'GROUP_ADMIN',
    CHURCH_ADMIN: 'CHURCH_ADMIN',
    PLATFORM_ADMIN: 'PLATFORM_ADMIN',
};
exports.DEFAULT_AVATAR_URL = '/assets/default-avatar.png';
exports.UPLOAD_LIMITS = {
    IMAGE_MAX_BYTES: 10 * 1024 * 1024,
    IMAGE_MAX_COUNT: 10,
    VIDEO_MAX_BYTES: 100 * 1024 * 1024,
    DOCUMENT_MAX_BYTES: 20 * 1024 * 1024,
    ALLOWED_DOCUMENT_MIMES: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
};
exports.REQUIRED_ACKNOWLEDGEMENTS = 10;
exports.NIGERIAN_STATES_LGAS = {
    Benue: [
        'Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West',
        'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo',
        'Ohimini', 'Oju', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya',
    ],
    FCT: ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council'],
    Lagos: ['Agege', 'Alimosho', 'Apapa', 'Eti-Osa', 'Ikeja', 'Ikorodu', 'Lagos Island', 'Lagos Mainland', 'Surulere'],
    Nasarawa: ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawa', 'Obi', 'Toto', 'Wamba'],
    Plateau: ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Langtang North', 'Mangu', 'Pankshin', 'Shendam'],
    Taraba: ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Ibi', 'Jalingo', 'Karim Lamido', 'Takum', 'Ussa', 'Wukari', 'Zing'],
    Kaduna: ['Chikun', 'Igabi', 'Kaduna North', 'Kaduna South', 'Kafanchan', 'Zaria'],
    CrossRiver: ['Bekwarra', 'Calabar Municipal', 'Calabar South', 'Ikom', 'Obanliku', 'Obudu', 'Ogoja', 'Yala'],
    Enugu: ['Enugu East', 'Enugu North', 'Enugu South', 'Nsukka', 'Udi'],
    Rivers: ['Eleme', 'Ikwerre', 'Obio-Akpor', 'Port Harcourt'],
};
//# sourceMappingURL=roles.constant.js.map