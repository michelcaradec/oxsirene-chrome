'use strict';

const session = (function () {
    const optMachineID = 'machineID';
    const optApiAccessToken = 'apiAccessToken';
    const optDeliveryCoordinates = 'deliveryCoordinates';
    const optMarketPlaceID = 'marketPlaceID';

    let settings = {
        // Initialized by `setMachineID`.
        [optMachineID]: null,
        // Updated by `refreshApiAccessToken`.
        [optApiAccessToken]: null,
        // Updated by `getLocation`.
        [optDeliveryCoordinates]: null,
        // Updated by `getMarketPlaceID`.
        [optMarketPlaceID]: null
    };

    return {
        /**
         * Machine identifier.
         * @param {string} value - Machine identifier
         * @type {string}
         */
        set machineID(value) { settings[optMachineID] = value; return settings[optMachineID]; },
        get machineID() { return settings[optMachineID]; },
        /**
        * API access token.
        * @param {string} value - API access token
        * @type {string}
        */
        set apiAccessToken(value) { settings[optApiAccessToken] = value; return settings[optApiAccessToken]; },
        get apiAccessToken() { return settings[optApiAccessToken]; },
        /**
         * Delivery location.
         * @param {Object} value - Delivery location object
         * @type {Object}
         */
        set deliveryCoordinates(value) { settings[optDeliveryCoordinates] = value; return settings[optDeliveryCoordinates]; },
        get deliveryCoordinates() { return settings[optDeliveryCoordinates]; },
        /**
         * Active page market place identifier.
         * @param {string} value - Market place identifier
         * @type {string}
         */
        set marketPlaceID(value) { settings[optMarketPlaceID] = value; return settings[optMarketPlaceID]; },
        get marketPlaceID() { return settings[optMarketPlaceID]; }
    };
})();
