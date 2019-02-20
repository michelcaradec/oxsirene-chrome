'use strict';

/**
 * Build user interface.
 */
function buildUI() {
  $(document).tooltip();

  // On-boarding.
  $('#onboardingMode')
    .checkboxradio()
    .click(() => {
      config.onboardingMode = $('#onboardingMode').is(':checked');
      chrome.storage.local.set({ [keyOnboarding]: config.onboardingMode });
    });

  chrome.storage.local.get([keyOnboarding], result => {
    config.onboardingMode = result[keyOnboarding] === undefined ? true : result[keyOnboarding];
    chrome.storage.local.set({ [keyOnboarding]: config.onboardingMode });

    $('#onboardingMode')
      .prop('checked', config.onboardingMode)
      .checkboxradio('refresh');
  });

  // Show OSM.
  $('#showOSM')
    .checkboxradio()
    .click(() => {
      config.showOSM = $('#showOSM').is(':checked');
      chrome.storage.local.set({ [keyShowOSM]: config.showOSM });
    });

  chrome.storage.local.get([keyShowOSM], result => {
    config.showOSM = result[keyShowOSM] === undefined ? true : result[keyShowOSM];
    chrome.storage.local.set({ [keyShowOSM]: config.showOSM });

    $('#showOSM')
      .prop('checked', config.showOSM)
      .checkboxradio('refresh');
  });
}

/**
 * Start session.
 */
function main() {
  buildUI();
}

main();
