'use strict';

//#region Progress bar

/**
 * Size of a progress bar step.
 * @constant
 * @type number
 */
const progressBarStep = 25;
/**
 * Progress bar current position.
 * @type number
 */
let progressBarPosition = 0;
/**
 * Progress bar maximum position.
 * @type number
 */
let progressBarMax;
/**
 * Progress step item identifier prefix.
 * @constant
 * @type string
 */
const progressStepIDPrefix = 'seller_';

/**
 * Compute number of steps for progress bar.
 * @param {number} sellersCount - Number of resellers
 * @returns {number} Number of steps
 */
function progressComputeSteps(sellersCount) {
  return (1/*scrapProduct*/
    + 1/*scrapSellers*/
    + sellersCount
    * (1/*scrapSeller*/ + 1/*querySirene*/ + 1/*queryBAN*/ + 1/*estimateDelivery*/)
  ) * progressBarStep;
}

/**
 * Initialize progress bar.
 * @param {number} max - Maximum number of steps
 */
function progressInit(max = 0) {
  // console.groupCollapsed("progressInit().");
  // console.log("max: ", max);
  // console.groupEnd();

  progressBarMax = max;
  $('#progressbar').progressbar({ value: 0, max: progressBarMax });
}

/**
 * Move forward progress bar.
 * @param {string} description - Message associated with current step
 * @param {number} offset - Number of steps to move
 * @param {string} id - Step identifier.
 * @param {string} parentID - Step parent identifier.
 */
function progressStep(description, offset = progressBarStep, id = null, parentID = null) {
  // console.groupCollapsed("progressStep().")
  // console.log("offset: ", offset);
  // console.log("description: ", description);
  // console.log("id: ", id);
  // console.log("parentID: ", parentID);
  // console.groupEnd();

  if (offset > 0) {
    progressBarPosition += offset;
    $('#progressbar').progressbar({ value: progressBarPosition });
  }

  if (id) {
    $('<div id=\'' + progressStepIDPrefix + id + '\'>' + '<li>' + description + '</li>' + '</div>').appendTo($('#estimate-steps'));
  } else if (parentID) {
    $('<li><font color=\'darkgrey\'>' + description + '</font></li>').appendTo($('#' + progressStepIDPrefix + parentID));
  } else {
    $('<li>' + description + '</li>').appendTo($('#estimate-steps'));
  }
}

/**
 * Move progress bar to the end.
 */
function progressCompleted() {
  //console.log("progressCompleted().")

  $('#progressbar').progressbar({ value: progressBarMax });
}

//#endregion
//#region Location

/**
 * Find location.
 * @param {string} address - Address to locate
 */
function getLocation(address = null) {
  console.groupCollapsed('getLocation().');
  console.log('address: ', address);
  console.groupEnd();

  resetUI();

  const onCompleted = (ban) => {
    console.log('ban: ', ban);

    $('#locationInput').val(ban.address);
    session.deliveryCoordinates = ban;
    chrome.storage.local.set({ [keyLocationLast]: ban });

    showOSM(ban.coordinates.lon, ban.coordinates.lat);
  };

  if (isNullOrWhitespace(address)) {
    getLocationFromIP(null, null, onCompleted);
  } else {
    getLocationFromAddress(address, onCompleted);
  }
}

/**
 * Remove map.
 */
function cleanOSM() {
  $('#open-street-map').contents().remove();
}

/**
 * Show location on a map.
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 */
function showOSM(lon, lat) {
  console.groupCollapsed('showOSM().');
  console.log('lon: ', lon);
  console.log('lat: ', lat);
  console.groupEnd();

  cleanOSM();

  if (config.showOSM) {
    const osmSrc = 'https://www.openstreetmap.org/export/embed.html?bbox=' +
      lon * (1 - osmZoom) +
      '%2C' +
      lat * (1 - osmZoom) +
      '%2C' + lon * (1 + osmZoom) +
      '%2C' + lat * (1 + osmZoom) +
      '&amp;layer=mapnik&amp;marker=' +
      lat + '%2C' +
      lon;

    $('<p><iframe class="map" src="' + osmSrc + '" style="border: 1px solid black"></iframe></p>')
      .appendTo($('#open-street-map'));
  } else {
    $('<p><i>Activez l\'affichage de la carte Open Street Map dans les options.</i></p>').appendTo($('#open-street-map'));
  }
}

//#endregion
//#region Estimate

/**
 * Run delivery estimate.
 */
function getEstimate() {
  console.log('getEstimate().');

  if (isNullOrWhitespace(locationInput.value)) {
    // We shouldn't arrive here, as location is guessed in the `main()` function.
    console.error('Attempt to run estimate with empty location.');
    return;
  }

  chrome.storage.local.get([keyLocationLast], result => {
    if (result[keyLocationLast]) {
      session.deliveryCoordinates = result[keyLocationLast];
      const cid = getCorrelationID();

      console.groupCollapsed('Delivery location loaded from storage.');
      console.log('deliveryCoordinates: ', session.deliveryCoordinates);
      console.groupEnd();

      $('#estimate-steps').contents().remove();
      $('#tabs').tabs('enable', 1).tabs({ active: 1 });
      progressStep('Identification des revendeurs.', 0);

      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        scrapProduct(cleanURL(tabs[0].url), cid)
          .then(scrapProductDone)
          .then(scrapSellers)
          .then(filterEstimates)
          .then(saveEstimates)
          .then(showEstimates);
        // FIXME: handle error on web request.
        //.catch((reason) => console.error(reason));
      });
    } else {
      // Delivery location must be set in order to run an estimate.
    }
  });
}

//#region API responses handlers

function scrapProductDone(sellers, textStatus, jqXHR) {
  if (jqXHR.status !== HttpStatus.Success) {
    return $.when($.extend({}, { sellers: sellers }, this));
  }

  const sellerIDs = Array.from(new Set(sellers.seller_ids));

  progressInit(progressComputeSteps(sellerIDs.length));
  progressStep('<b>' + sellerIDs.length + '</b> revendeur(s) détecté(s).');

  return $.when($.extend({}, { sellers: sellers }, this));
}

function scrapSellers(args, textStatus, jqXHR) {
  if (!args.sellers) {
    return $.when($.extend({}, args, this));
  }

  const sellerIDs = Array.from(new Set(args.sellers.seller_ids));

  console.groupCollapsed('scrapSellers().');
  console.log('sellerIDs: ', sellerIDs);
  console.log('correlationID: ', args.correlationID);
  console.groupEnd();

  let promises = [];

  for (let sellerID of sellerIDs) {
    const sellerPosition = promises.length;
    progressStep(
      'Collecte des informations du revendeur <b>' + sellerID + '</b>.',
      progressBarStep,
      sellerPosition);

    const promise = scrapSeller(args.url,
      args.sellers.market_place_id,
      args.sellers.product_name,
      sellerID,
      sellerPosition,
      args.correlationID)
      .then(scrapSellerDone)
      .then(querySirene)
      .then(querySireneDone)
      .then(queryBAN)
      .then(queryBANDone)
      .then(estimateDelivery)
      .then(estimateDeliveryDone);
    promises.push(promise);
  }

  return Promise.all(promises.map(p => p.catch(e => {
    console.error(e);
    return null;
  })));
}

function scrapSellerDone(seller, textStatus, jqXHR) {
  const seller_code = seller.siret ? seller.siret : seller.siren;
  if (!seller_code) {
    progressStep(
      '<font color=\'red\'><i>Le revendeur <b>' + seller.seller_id + '</b> n\'est pas situé en France.</i></font>',
      0,
      null,
      this.position);
  } else {
    progressStep(
      'Collecte des informations du revendeur <b>' + seller.seller_id + '</b> (' + seller_code + ' - Sirene).',
      progressBarStep,
      null,
      this.position);
  }

  return $.when($.extend({}, { seller: seller }, this));
}

function querySireneDone(sirene, textStatus, jqXHR) {
  if (sirene
    && sirene.organizations
    && sirene.organizations.length > 0) {
    const organization = sirene.organizations[0];
    const address = organization.address;

    progressStep(
      'Localisation du revendeur <b>' + address + '</b> (BAN).',
      progressBarStep,
      null,
      this.position);
  }

  return $.when($.extend({}, { sirene: sirene }, this));
}

function queryBANDone(ban, textStatus, jqXHR) {
  if (ban && ban.address) {
    progressStep(
      '<i>' + ban.address + '.</i>',
      0,
      null,
      this.position);
    progressStep(
      'Estimation de la livraison par le revendeur.',
      progressBarStep,
      null,
      this.position);
  }

  return $.when($.extend({}, { ban: ban }, this));
}

function estimateDeliveryDone(estimate, textStatus, jqXHR) {
  if (!estimate) {
    return $.when(this);
  }

  console.groupCollapsed('estimateDeliveryDone().');
  console.log('estimate: ', estimate);
  console.log('correlationID: ', this.correlationID);
  console.groupEnd();

  progressStep(
    'Distance de la livraison : <b>' + estimate.distance.toFixed(2) + ' km</b>.',
    progressBarStep,
    null,
    this.position);

  return $.when($.extend({}, { estimate: estimate }, this));
}

//#endregion

/**
 * Check for estimate object validity.
 * @param {Object} item - Item to check
 * @returns {boolean} Estimate validity
 */
function isValidEstimate(item) {
  return item && item.estimate && item.estimate.distance;
}

/**
 * Filter invalid estimates.
 * @param {Object[]} estimates - Estimate objects
 * @returns {Object[]} Valid estimates objects
 */
function filterEstimates(estimates) {
  // estimates = [ { url: ..., product: ..., seller: ..., sirene: ..., organization: organization, ban: ..., estimate: ... } ]
  const estimatesOrdered = estimates
    .filter(isValidEstimate)
    .sort((first, second) => first.estimate.distance - second.estimate.distance);

  console.groupCollapsed('filterEstimates().');
  console.log('ordered: ', estimatesOrdered);
  console.groupEnd();

  return $.when(estimatesOrdered);
}

/**
 * Store estimates.
 * @param {Object[]} estimates - Estimate objects
 * @returns {Object[]} Estimate objects
 */
function saveEstimates(estimates) {
  console.log('saveEstimates().');

  if (estimates && estimates.length > 0) {
    chrome.storage.local.set({ [keyEstimatesLast]: { url: estimates[0].url, product: estimates[0].product, estimates: estimates } });
  } else {
    chrome.storage.local.remove([keyEstimatesLast]);
  }

  return $.when(estimates);
}

/**
 * Display estimates.
 * @param {Object[]} estimates - Estimate objects
 */
function showEstimates(estimates) {
  console.log('showEstimates().');

  progressCompleted();
  $('#tabs').tabs('enable', 2).tabs({ active: 2 });
  $('#delivery-estimate').contents().remove();

  if (estimates && estimates.length > 0) {
    let first = true;

    for (let estimate of estimates) {
      //const carbon_print = estimate.estimate.carbon_print.toFixed(2);
      const seller_name = isNullOrWhitespace(estimate.organization.name)
        ? isNullOrWhitespace(estimate.seller.name) ? '?' : estimate.seller.name
        : estimate.organization.name;

      $('<div class=\'' + (first ? 'sellerFirst' : 'seller') + '\'>' + '<b><a>' + seller_name + '</a></b></div>')
        .find('a:first')
        .attr('href', 'https://www.pagesjaunes.fr/recherche/' + encodeURI(estimate.ban.city) + '/' + encodeURI(seller_name))
        .click((it) => chrome.tabs.create({ url: it.target.href }))
        .attr('title', 'Cliquez sur ce lien pour trouver le revendeur dans l\'annuaire des Pages Jaunes.')
        .end()
        .append('<br>')
        .append('<a>' + estimate.ban.address + '</a>.')
        .find('a:eq(1)')
        .attr('href', 'https://www.openstreetmap.org/' +
          '?mlat=' + estimate.ban.coordinates.lat +
          '&mlon=' + estimate.ban.coordinates.lon +
          '#map=13/' +
          estimate.ban.coordinates.lat +
          '/' + estimate.ban.coordinates.lon)
        .click((it) => chrome.tabs.create({ url: it.target.href }))
        .attr('title', 'Cliquez sur ce lien pour localiser le revendeur sur une carte Open Street Map.')
        .end()
        .append('<br>')
        .append('<div>Distance : <b><a>' + estimate.estimate.distance.toFixed(2) + ' km</a></b>.</div>')
        .find('div:eq(0)')
        .attr('title', 'Le trajet par route entre le revendeur et le lieux de livraison est d\'environ ' + estimate.estimate.distance.toFixed(2) + ' km (cliquez sur ce lien pour visualiser le trajet).')
        .end()
        .find('a:eq(2)')
        .attr('href', 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=' +
          estimate.ban.coordinates.lat +
          ',' + estimate.ban.coordinates.lon +
          ';' + session.deliveryCoordinates.coordinates.lat +
          ',' + session.deliveryCoordinates.coordinates.lon)
        .click((it) => chrome.tabs.create({ url: it.target.href }))
        .end()
        // .append("<div>Empreinte carbone : <b>" + carbon_print + " kg</b>.</div>")
        // .find("div:eq(1)")
        // .attr("title", "La livraison de votre article contribuera à une empreinte carbone totale de " + carbon_print + " kg de CO2.")
        // .end()
        .append('<br>')
        .appendTo($('#delivery-estimate'));

      first = false;
    }
  } else {
    $('<p><font color=\'red\'>Aucun revendeur n\'a été trouvé sur le territoire français.</font></p>')
      .appendTo($('#delivery-estimate'));
  }
}

/**
 * Show estimates previously executed.
 * Handy to prevent running the same estimate when pop-up is closed by mistake.
 */
function showPageEstimates() {
  console.log('showPageEstimates().');

  chrome.storage.local.get([keyEstimatesLast], result => {
    const estimates_last = result[keyEstimatesLast];
    if (estimates_last) {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const urlString = cleanURL(tabs[0].url);

        if (urlString === estimates_last.url) {
          showEstimates(estimates_last.estimates);
        }
      });
    }
  });
}

//#endregion
//#region UI

/**
 * Show help page.
 */
function showHelp() {
  onboarding();
  // if (chrome.runtime.openOptionsPage) {
  //   chrome.runtime.openOptionsPage();
  // } else {
  //   window.open(chrome.runtime.getURL("options.html"));
  // }
}

/**
 * Build user interface.
 */
function buildUI() {
  $(document).tooltip();

  $('#locationInput').keyup(e => {
    if (e.keyCode === 13) {
      getLocation(locationInput.value);
    }
  });

  // https://api.jqueryui.com/resources/icons-list.html

  $('#checkLocation')
    .button({ icon: 'ui-icon-refresh', showLabel: false })
    .click(() => {
      getLocation(locationInput.value);
    });

  $('#runEstimate')
    .button({ icon: 'ui-icon-circle-zoomout', showLabel: false })
    .click(() => {
      getEstimate();
    });

  $('#showHelp')
    .button({ icon: 'ui-icon-help', showLabel: false })
    .click(() => {
      showHelp();
    });

  resetUI();
}

/**
 * Initialize user interface.
 */
function resetUI() {
  $('#tabs').tabs({ active: 0 }).tabs('option', 'disabled', [1, 2]);
  progressInit();
  cleanOSM();
  $('#estimate-steps').contents().remove();
}

//#endregion

/**
 * Start session.
 */
function main() {
  // Set machine identifier (initialized in background script).
  setMachineID();

  // Read API access token.
  refreshApiAccessToken();

  chrome.storage.sync.get([keyEligibilityState], result => {
    const state = result[keyEligibilityState];
    console.log('Eligibility state: ', state);

    $('#runEstimate').prop('disabled', state !== EligibilityState.OnProductPage);

    switch (state) {
      case EligibilityState.UnknownMarketPlace:
        $('<p><font color=\'red\'><b>Aucune place de marché connue n\'a été identifiée sur cette page.</b></font></p>').appendTo($('#message'));
        break;
      case EligibilityState.NotOnProductPage:
        $('<p><font color=\'orange\'><b>Aucun revendeur n\'a été trouvé sur cette page.</b></font></p>').appendTo($('#message'));
        break;
      case EligibilityState.OnProductPage:
        showPageEstimates();
        break;
    }
  });

  // Read last location.
  chrome.storage.local.get([keyLocationLast], result => {
    const location = result[keyLocationLast];
    if (location) {
      $('#locationInput').val(location.address);
      session.deliveryCoordinates = location;
      showOSM(location.coordinates.lon, location.coordinates.lat);
    } else {
      getLocation();
    }
  });

  //#region Config

  // On-boarding.
  chrome.storage.local.get([keyOnboarding], result => {
    config.onboardingMode = result[keyOnboarding] === undefined ? true : result[keyOnboarding];

    if (config.onboardingMode) {
      onboarding();
    }

    // On-boarding only showned once.
    chrome.storage.local.set({ [keyOnboarding]: false });
  });

  // Show OSM
  chrome.storage.local.get([keyShowOSM], result => {
    config.showOSM = result[keyShowOSM] === undefined ? true : result[keyShowOSM];
    chrome.storage.local.set({ [keyShowOSM]: config.showOSM });
  });

  //#endregion

  buildUI();
}

main();
