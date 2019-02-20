'use strict';

/**
 * Find location from an address.
 * @param {string} address - Address to locate
 * @param {function} onCompleted - Callback called when operation succeeds
 */
function getLocationFromAddress(address, onCompleted) {
  const cid = this && this.correlationID ? this.correlationID : getCorrelationID();

  console.groupCollapsed('getLocationFromAddress().');
  console.log('address: ', address);
  console.log('correlationID: ', cid);
  console.groupEnd();

  $.ajax({
    url: apiServer + '/ban' + '?code=' + session.apiAccessToken.token,
    type: 'POST',
    data: JSON.stringify({ address: locationInput.value }),
    dataType: 'json',
    headers: {
      [httpHeaderRequestID]: cid
    },
    context: {
      correlationID: cid
    }
  }).done(ban => {
    onCompleted(ban);
  }).fail(error => {
    console.error(error);
  });
}

/**
 * Find location from IP address.
 * @param {string} ip - IP address
 * @param {string} correlationID - Correlation identifier
 * @param {function} onCompleted - Callback called when operation succeeds
 */
function getLocationFromIP(ip = null, correlationID = null, onCompleted = null) {
  const cid = correlationID ? correlationID : getCorrelationID();
  const url = apiServer + '/location' + (isNullOrWhitespace(ip) ? '' : '/' + ip);

  console.groupCollapsed('getLocationFromIP().');
  console.log('ip: ', ip);
  console.log('url: ', url);
  console.log('correlationID: ', cid);
  console.groupEnd();

  // First try: use API.
  $.ajax({
    url: url + '?code=' + session.apiAccessToken.token,
    headers: {
      [httpHeaderRequestID]: cid
    },
    context: {
      correlationID: cid
    }
  }).done(location => {
    console.log('location: ', location);

    getLocationFromCoordinates(location.coordinates.lon, location.coordinates.lat, cid, onCompleted);
  }).fail(error => {
    console.error(error);

    if (!ip) {
      // Second try: use an external service.
      $.get('http://api.ipify.org/?format=json', location => {
        getLocationFromIP(location.ip, cid, onCompleted);
      });
    }
  });
}

/**
 * Find location from coordinates.
 * @param {double} lon - Longitude
 * @param {double} lat - Latitude
 * @param {string} correlationID - Correlation identifier
 * @param {function} onCompleted - Callback called when operation succeeds
 */
function getLocationFromCoordinates(lon, lat, correlationID = null, onCompleted = null) {
  const cid = correlationID ? correlationID : getCorrelationID();

  console.groupCollapsed('getLocationFromCoordinates().');
  console.log('lon: ', lon);
  console.log('lat: ', lat);
  console.log('correlationID: ', cid);
  console.groupEnd();

  $.ajax({
    url: apiServer + '/ban/' + lon + '/' + lat + '?code=' + session.apiAccessToken.token,
    headers: {
      [httpHeaderRequestID]: cid
    },
    context: {
      correlationID: cid
    }
  }).done(ban => {
    onCompleted(ban);
  }).fail(error => {
    console.error(error);
  });
}
