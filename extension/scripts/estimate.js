'use strict';

/**
 * Extract sellers from product page.
 * @param {string} url - Product page URL
 * @param {string} correlationID - Correlation identifier
 * @return {Object} Product sellers identifiers
 */
function scrapProduct(url, correlationID) {
    console.groupCollapsed('scrapProduct().');
    console.log('url: ', url);
    console.log('correlationID: ', correlationID);
    console.groupEnd();

    return $.ajax({
        url: apiServer + '/product/scrap' + '?code=' + session.apiAccessToken.token,
        type: 'POST',
        data: JSON.stringify({ page: url }),
        dataType: 'json',
        headers: {
            [httpHeaderRequestID]: correlationID
        },
        context: {
            url: url,
            correlationID: correlationID
        }
    });
}

/**
 * Collect seller informations from a web page.
 * @param {string} url - Product page URL
 * @param {string} marketPlaceID - Market place identifier
 * @param {string} productName - Product name
 * @param {string} sellerID - Seller identifier
 * @param {number} sellerPosition - Seller position in sellers list (used for ordering)
 * @param {string} correlationID - Correlation identifier
 * @returns {Object} Seller informations
 */
function scrapSeller(url, marketPlaceID, productName, sellerID, sellerPosition, correlationID) {
    console.groupCollapsed('scrapSeller().');
    console.log('marketPlaceID: ', marketPlaceID);
    console.log('productName: ', productName);
    console.log('sellerID: ', sellerID);
    console.log('sellerPosition: ', sellerPosition);
    console.log('correlationID: ', correlationID);
    console.groupEnd();

    return $.ajax({
        url: apiServer + '/seller/scrap/' + marketPlaceID + '/' + sellerID + '?code=' + session.apiAccessToken.token,
        headers: {
            [httpHeaderRequestID]: correlationID
        },
        context: {
            position: sellerPosition,
            url: url,
            product: {
                marketPlaceID: marketPlaceID,
                productName: productName
            },
            correlationID: correlationID
        }
    });
}

/**
 * Get seller SIRENE informations.
 * @param {Object} args - Seller informations (as returned by `scrapSeller`)
 * @param {string} textStatus - Type of error that occurred
 * @param {XMLHttpRequest} jqXHR - Request object
 * @returns {Object} SIRENE informations
 */
function querySirene(args, textStatus, jqXHR) {
    const sellerCode = args.seller.siret ? args.seller.siret : args.seller.siren;

    console.groupCollapsed('querySirene().');
    console.log('sellerCode: ', sellerCode);
    console.log('seller: ', args.seller);
    console.log('correlationID: ', args.correlationID);
    console.groupEnd();

    if (!sellerCode) {
        return $.when();
    }

    return $.ajax({
        url: apiServer + '/sirene/' + sellerCode + '?code=' + session.apiAccessToken.token,
        headers: {
            [httpHeaderRequestID]: args.correlationID
        },
        context: {
            position: args.position,
            url: args.url,
            product: args.product,
            seller: args.seller,
            correlationID: args.correlationID
        }
    });
}

/**
 * Get seller address and location details.
 * @param {Object} args - Seller SIRENE informations
 * @param {string} textStatus - Type of error that occurred
 * @param {XMLHttpRequest} jqXHR - Request object
 * @returns {Object} Address and location details
 */
function queryBAN(args, textStatus, jqXHR) {
    if (!(args.sirene
        && args.sirene.organizations
        && args.sirene.organizations.length > 0)) {
        return $.when(args);
    }

    const organization = args.sirene.organizations[0];
    const address = organization.address;

    console.groupCollapsed('queryBAN().');
    console.log('address: ', address);
    console.log('correlationID: ', args.correlationID);
    console.groupEnd();

    return $.ajax({
        url: apiServer + '/ban' + '?code=' + session.apiAccessToken.token,
        type: 'POST',
        data: JSON.stringify({ address: address }),
        dataType: 'json',
        headers: {
            [httpHeaderRequestID]: args.correlationID
        },
        context: {
            position: args.position,
            url: args.url,
            product: args.product,
            seller: args.seller,
            sirene: args.sirene,
            organization: organization,
            correlationID: args.correlationID
        }
    });
}

/**
 * Estimate delivery effort.
 * @param {Object} args - Seller location
 * @param {string} textStatus - Type of error that occurred
 * @param {XMLHttpRequest} jqXHR - Request object
 * @returns {Object} Delivery effort
 */
function estimateDelivery(args, textStatus, jqXHR) {
    if (!args.ban || !args.ban.coordinates) {
        return $.when();
    }

    console.groupCollapsed('estimateDelivery().');
    console.log('address: ', args.ban.address);
    console.log('correlationID: ', args.correlationID);
    console.groupEnd();

    // FIXME: pass `deliveryCoordinates` as an argument
    // https://stackoverflow.com/questions/32912459/promises-pass-additional-parameters-to-then-chain
    return $.ajax({
        url: apiServer + '/delivery/estimate/'
            + session.deliveryCoordinates.coordinates.lon
            + '/' + session.deliveryCoordinates.coordinates.lat
            + '/' + args.ban.coordinates.lon
            + '/' + args.ban.coordinates.lat
            + '?code=' + session.apiAccessToken.token,
        headers: {
            [httpHeaderRequestID]: args.correlationID
        },
        context: {
            position: args.position,
            url: args.url,
            product: args.product,
            seller: args.seller,
            sirene: args.sirene,
            organization: args.organization,
            ban: args.ban,
            correlationID: args.correlationID
        }
    });
}
