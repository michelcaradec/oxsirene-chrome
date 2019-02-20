'use strict';

/**
 * Get a pseudo-unique identifier.
 * @param {string} prefix - Identifier prefix
 * @returns {string} - Identifier
 */
function getUniqueId(prefix = new Date().getTime().toString()) {
    const offset = Math.random().toString().substring(2);

    return (isNullOrWhitespace(prefix) ? '' : prefix + '-') + offset;
}

/**
 * Set machine identifier.
 * A new machine identifier is created when not found in local storage.
 */
function setMachineID() {
    if (!session.machineID) {
        chrome.storage.local.get([keyMachineID], result => {
            session.machineID = result[keyMachineID];
            if (!session.machineID) {
                session.machineID = getUniqueId();

                console.groupCollapsed('setMachineID().');
                console.log('machineID (from new)', session.machineID);
                console.groupEnd();

                chrome.storage.local.set({ [keyMachineID]: session.machineID });
            } else {
                console.groupCollapsed('setMachineID().');
                console.log('machineID (from storage)', session.machineID);
                console.groupEnd();
            }
        });
    } else {
        console.groupCollapsed('setMachineID().');
        console.log('machineID (from memory)', session.machineID);
        console.groupEnd();
    }
}

/**
 * Get a correlation ID.
 * @returns {string} - Correlation identifier
 */
function getCorrelationID() {
    if (!session.machineID) {
        console.error('Missing machine identifier.');
        return getUniqueId(null);
    } else {
        return session.machineID + '-' + getUniqueId(null);
    }
}
