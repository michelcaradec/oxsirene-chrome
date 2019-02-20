'use strict';

const config = (function () {
    const optShowOSM = 'showOSM';
    const optShowCarbonPrint = 'showCarbonPrint';
    const optOnboardingMode = 'onboardingMode';

    let settings = {
        [optShowOSM]: true,
        [optShowCarbonPrint]: false,
        [optOnboardingMode]: true
    };

    return {
        /**
         * Show delivery location on Open Street Map.
         * @param {boolean} value - Display state
         * @type {boolean}
         */
        set showOSM(value) { settings[optShowOSM] = value; return settings[optShowOSM]; },
        get showOSM() { return settings[optShowOSM]; },
        /**
         * Show estimated carbon print contribution.
         * @param {boolean} value - Display state
         * @type {boolean}
         */
        set showCarbonPrint(value) { settings[optShowCarbonPrint] = value; return settings[optShowCarbonPrint]; },
        get showCarbonPrint() { return settings[optShowCarbonPrint]; },
        /**
         * Activate onboarding mode.
         * @param {boolean} value - Activation state
         * @type {boolean}
         */
        set onboardingMode(value) { settings[optOnboardingMode] = value; return settings[optOnboardingMode]; },
        get onboardingMode() { return settings[optOnboardingMode]; }
    };
})();
