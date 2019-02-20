'use strict';

const showPageActionOnMarketPlace = {
  conditions: [
    new chrome.declarativeContent.PageStateMatcher({
      pageUrl: { urlMatches: '(www)\.amazon\.fr', schemes: ['http', 'https'] }
    }),
    new chrome.declarativeContent.PageStateMatcher({
      pageUrl: { urlMatches: '(www)\.cdiscount\.com', schemes: ['http', 'https'] }
    })
  ],
  actions: [new chrome.declarativeContent.ShowPageAction()]
};

// One-time intialization.
chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([showPageActionOnMarketPlace]);
  });

  // Set machine identfier (first time).
  setMachineID();

  //#region API access token

  // First time retrieval.
  refreshApiAccessToken();
  // Schedule alarm for future retrievals.
  chrome.alarms.clear(alarmApiAccessToken);
  chrome.alarms.create(alarmApiAccessToken, { periodInMinutes: alarmApiAccessTokenPeriod });

  //#endregion
});

// https://developer.chrome.com/extensions/runtime#event-onSuspend
chrome.runtime.onSuspend.addListener(() => {
  console.log('runtime.onSuspend().');
});

// https://developer.chrome.com/extensions/tabs#event-onActivated
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.groupCollapsed('tabs.onActivated().');
  console.log('activeInfo: ', activeInfo);
  console.groupEnd();

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    checkEligiblity(tabs && tabs[0].hasOwnProperty('url') ? tabs[0].url : null);
  });
});

// https://developer.chrome.com/extensions/webNavigation#event-onCompleted
chrome.webNavigation.onCompleted.addListener(
  function (details) {
    console.groupCollapsed('webNavigation.onCompleted().');
    console.log('details: ', details);
    console.groupEnd();

    // Use active tab URL to handle web requests sent to third-parties (such as criteo)
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      checkEligiblity(tabs && tabs[0].hasOwnProperty('url') ? tabs[0].url : null);
    });
  },
  {
    url: [
      showPageActionOnMarketPlace.conditions[0].pageUrl,
      showPageActionOnMarketPlace.conditions[1].pageUrl
    ]
  }
);

// https://developer.chrome.com/extensions/alarms#event-onAlarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === alarmApiAccessToken) {
    console.groupCollapsed('alarms.onAlarm().');
    console.log('alarm: ', alarmApiAccessToken);
    console.groupEnd();

    refreshApiAccessToken();
  }
});

// Set machine identifier (each time).
setMachineID();

// Read API access token (each time).
refreshApiAccessToken();
