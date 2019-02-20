'use strict';

//#region constants

/**
 * API server base URL.
 * @constant
 * @type string
 */
const apiServerLocal = 'http://localhost:7071/api/v1';
const apiServerProd = 'https://oxsirenefunc.azurewebsites.net/api/v1';
const apiServer = apiServerProd;
/**
 * HTTP status codes.
 * @constant
 * @type number
 */
const HttpStatus = {
  Success: 200,
  NotFound: 404
};
/**
 * Request ID HTTP header.
 * @constant
 * @type number
 */
const httpHeaderRequestID = 'X-Request-ID';
/**
 * Machine identifier storage key.
 * @constant
 * @type string
 */
const keyMachineID = 'machine_id';
/**
 * Last estimates storage key.
 * @constant
 * @type string
 */
const keyEstimatesLast = 'estimates_last';
/**
 * Last location storage key.
 * @constant
 * @type: string
 */
const keyLocationLast = 'location';
/**
 * Eligibility check script storage key.
 * @constant
 * @type string
 */
const keyChecker = 'checker';
/**
 * Market place marker for Amazon.
 * @constant
 * @type string
 */
const marketPlaceMarkerAmazon = 'www.amazon.';
/**
 * Market place identifier for Amazon.
 * @constant
 * @type string
 */
const marketPlaceIDAmazon = 'amazon';
/**
 * Market place marker for Cdiscount.
 * @constant
 * @type string
 */
const marketPlaceMarkerCdiscount = 'www.cdiscount.com';
/**
 * Market place identifier for Amazon.
 * @constant
 * @type string
 */
const marketPlaceIDCdiscount = 'cdiscount';
/**
 * Number of milli-seconds in one day.
 * @constant
 * @type number
 */
const oneHourInMs = 3600000;
/**
 * Eligibility check script age limit (ms).
 * @constant
 * @type number
 */
const checkerAgeLimit = oneHourInMs * 24;
/**
 * Active page eligibility state storage key.
 * @constant
 * @type EligibilityState
 */
const keyEligibilityState = 'eligibility_state';
/**
 * HTTP status codes.
 * @constant
 * @type number
 */
const EligibilityState = {
  UnknownMarketPlace: 0,
  NotOnProductPage: 1,
  OnProductPage: 2
};
/**
 * Open Street Map zoom factor.
 * @constant
 * @tyme number
 */
const osmZoom = .0001;
/**
 * API access token storage key.
 * @constant
 * @type string
 */
const keyApiAccessToken = 'access_token';
/**
 * API access token age limit (ms).
 * @constant
 * @type number
 */
const apiAccessTokenAgeLimit = oneHourInMs * 24;
/**
 * API access token alarm name.
 * @constant
 * @type string
 */
const alarmApiAccessToken = 'apiAccessToken';
/**
 * API access token alarm frequency (minutes).
 * @constant
 * type number
 */
const alarmApiAccessTokenPeriod = 1;
/**
 * On-boarding switch storage key.
 * @constant
 * @type string
 */
const keyOnboarding = 'on_boarding';
/**
 * Open Street Map display switch storage key.
 * @constant
 * @type string
 */
const keyShowOSM = 'show_osm';

//#endregion
