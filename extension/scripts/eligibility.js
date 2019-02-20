'use strict';

/**
 * Get market place identifier for a given page.
 * @param {string} urlString - URL to check
 * @returns {string} Market place identifier
 */
function getMarketPlaceID(urlString) {
    const url = new URL(urlString);

    console.groupCollapsed('getMarketPlaceID().');
    console.log('url: ', url);

    if (url.hostname.toLowerCase().startsWith(marketPlaceMarkerAmazon)) {
        session.marketPlaceID = marketPlaceIDAmazon;
    } else if (url.hostname.toLowerCase() === marketPlaceMarkerCdiscount) {
        session.marketPlaceID = marketPlaceIDCdiscount;
    } else {
        session.marketPlaceID = null;
    }

    console.log('market_place_id: ', session.marketPlaceID);
    console.groupEnd();

    return session.marketPlaceID;
}

/**
 * Get market place storage key.
 * @returns {string} Market place storage key
 */
function getMarketPlaceIDKey() {
    return keyChecker + '_' + session.marketPlaceID;
}

/**
 * Get eligibility checker script for a given URL.
 * @param {string} url - Active page URL
 * @returns {Object} Eligibility checker object
 */
function getEligibilityChecker(url) {
    const cid = getCorrelationID();

    console.groupCollapsed('getEligibilityChecker().');
    console.log('url: ', url);
    console.log('correlationID', cid);
    console.groupEnd();

    return $.ajax({
        url: apiServer + '/product/checker' + '?code=' + session.apiAccessToken.token,
        type: 'POST',
        data: JSON.stringify({ page: url }),
        dataType: 'json',
        headers: {
            [httpHeaderRequestID]: cid
        },
        context: {
            correlationID: cid
        }
    });
}

/**
 * Check eligibility checker object validity.
 * @param {Object} checker - Eligibility checker object
 * @returns {boolean} Eligibility checker object validity state
 */
function isEligibilityCheckerExpired(checker) {
    const isExpired = !checker || new Date() - new Date(checker.date) > checkerAgeLimit;

    console.groupCollapsed('isEligibilityCheckerExpired().');
    console.log('checker: ', checker);
    console.log('expired: ', isExpired);
    console.groupEnd();

    return isExpired;
}

/**
 * Save eligibility checker script.
 * @param {Object} checker - Eligibility checker object
 * @returns {Object} Eligibility checker object
 */
function storeEligibilityChecker(checker) {
    const store = checker ? { date: new Date().toJSON(), market_place_id: checker.market_place_id, script: checker.script } : null;

    console.groupCollapsed('storeEligibilityChecker().');
    console.log('checker: ', store);
    console.groupEnd();

    if (store) {
        chrome.storage.local.set({
            [getMarketPlaceIDKey()]: store
        });
    } else {
        chrome.storage.local.remove([getMarketPlaceIDKey()]);
    }

    return $.when(checker);
}

/**
 * Set active page eligibility state.
 * @param {EligibilityState} state - Eligibility state
 */
function setEligibilityState(state) {
    console.groupCollapsed('setEligibilityState().');
    console.log('state: ', state);
    console.groupEnd();

    chrome.storage.sync.set({
        [keyEligibilityState]: state
    });

    // Set extension icon based on eligibility state:
    // - Unknown market place = red.
    // - Known market place = orange.
    // - Known market place, on a product page = green.
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.pageAction.setIcon({
            tabId: tabs[0].id,
            path: 'images/state_' +
                (state === EligibilityState.UnknownMarketPlace
                    ? 'unknown'
                    : state === EligibilityState.NotOnProductPage ? 'off' : 'on'
                ) + '/logo32.png'
        });
    });
}

/**
 * Execute eligibility checker script on active page.
 * @param {Object} checker - Eligibility checker object
 * @returns {Object}  Eligibility checker object
 */
function runEligibilityChecker(checker) {
    console.groupCollapsed('runEligibilityChecker().');
    console.log('checker: ', checker);
    console.groupEnd();

    if (checker && checker.script) {
        chrome.tabs.executeScript(
            null,
            { code: checker.script + 'check(document.documentElement.innerHTML);' },
            eligible => {
                setEligibilityState(eligible.toString() === 'true' ? EligibilityState.OnProductPage : EligibilityState.NotOnProductPage);
            }
        );
    } else {
        console.warn('Missing eligibility checker.');
        setEligibilityState(EligibilityState.UnknownMarketPlace);
    }

    return $.when(checker);
}

/**
 * Check active page eligibility.
 * @param {string} url - Active page URL
 */
function checkEligiblity(url = null) {
    console.groupCollapsed('checkEligiblity().');
    console.log('url: ', url);
    console.groupEnd();

    if (url) {
        if (getMarketPlaceID(url)) {
            chrome.storage.local.get([getMarketPlaceIDKey()], result => {
                const checker = result[getMarketPlaceIDKey()];
                if (isEligibilityCheckerExpired(checker)) {
                    getEligibilityChecker(url)
                        .then(storeEligibilityChecker)
                        .then(runEligibilityChecker);
                } else {
                    runEligibilityChecker(checker);
                }
            });
        } else {
            setEligibilityState(EligibilityState.UnknownMarketPlace);
        }
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            checkEligiblity(cleanURL(tabs[0].url));
        });
    }
}
