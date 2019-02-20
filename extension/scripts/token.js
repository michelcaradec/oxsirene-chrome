'use strict';

/**
 * Refresh API access token.
 */
function refreshApiAccessToken() {
    console.log('refreshApiAccessToken().');

    chrome.storage.local.get([keyApiAccessToken], result => {
        session.apiAccessToken = result[keyApiAccessToken] === undefined ? null : result[keyApiAccessToken];
        if (isApiAccessTokenExpired(session.apiAccessToken)) {
            getApiAccessToken()
                .then(storeApiAccessToken);
        }
    });
}

/**
 * Check API access token object validity.
 * @param {Object} accessToken - API access token object
 * @returns {boolean} API access token expiration state
 */
function isApiAccessTokenExpired(accessToken) {
    const isExpired = !accessToken || new Date() - new Date(accessToken.date) > apiAccessTokenAgeLimit;

    console.groupCollapsed('isApiAccessTokenExpired().');
    console.log('accessToken: ', accessToken);
    console.log('expired: ', isExpired);
    console.groupEnd();

    return isExpired;
}

/**
 * Get API access token.
 * @returns {Object} API access token.
 */
function getApiAccessToken() {
    const cid = getCorrelationID();

    console.groupCollapsed('getApiAccessToken().');
    console.log('correlationID', cid);
    console.groupEnd();

    return $.ajax({
        url: apiServer + '/token',
        headers: {
            [httpHeaderRequestID]: cid
        },
        context: {
            correlationID: cid
        }
    });
}

/**
 * Save API access token.
 * @param {Object} token - API access token object
 */
function storeApiAccessToken(token) {
    const store = token ? { date: new Date().toJSON(), token: token.key } : null;

    console.groupCollapsed('storeApiAccessToken().');
    console.log('token: ', store);
    console.groupEnd();

    session.apiAccessToken = store;

    chrome.storage.local.set({
        [keyApiAccessToken]: store
    });
}
