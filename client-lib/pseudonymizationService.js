'use strict';

/**
 * This module is used to connect to the configured Pseudonymization service.
 */
function PseudonymizationService() {
}
;

/**
 * The IDAT of a patient.
 * Stores the identifying data.
 * @typedef {Object} IDAT
 * @property {string} firstname Firstname of the patient.
 * @property {string} lastname Lastname of the patient.
 * @property {Date} birthday Birthday of the patient.
 */

/**
 * The MDAT of a patient.
 * Stores the medical data.
 * For now, every object with key - value pairs is valid.
 * @typedef {Object} MDAT
 */

/**
 * Object containing all informations about an occurring conflict.
 * @typedef {Object} Conflict
 * @property {ConflictStatus} statusCode ConflictStatus of this conflict.
 * @property {string} statusMessage Message containing detailed informations about the conflict.
 * @property {string} tokenURL Token used for the pseudonymization attempt. Can be reused until the conflict is resolved.
 */

/**
 * Object representing a patient.
 * @typedef {Object} Patient
 * @property {PatientStatus} status Status of the pseudonymization.
 * @property {boolean} sureness Sureness of the idat. See documentation of the Mainzelliste.
 * @property {string} pseudonym Pseudonym of this patient. null until it got created via createPseudonyms.
 * @property {IDAT} idat IDAT of this patient.
 * @property {MDAT} mdat MDAT of this patient. May be null.
 * @property {Conflict} conflict Most recent conflict. null if no conflict occurred.
 */

/**
 * Id identifying a patient. Any type is allowed.
 * Only used in client side.
 * @typedef {*} patientId
 */

/**
 * The PatientStatus can have following values:
 * -1: The patient has an unsolved conflict.
 * 0: The patient got successful created and has valid IDAT.
 * 1: The pseudonym has benn created.
 * 2: The process, either storing or searching the MDAT, was successful.
 * @typedef {number} PatientStatus
 */
const PatientStatus = Object.freeze({
    CONFLICT: -1,
    CREATED: 0,
    PSEUDONYMIZED: 1,
    HANDLED: 2
});

/**
 * The ConflictStatus can have following values:
 * 1: unknown error without detailed informations
 * 2: invalid idat
 * 3: invalid token
 * 4: conflicting idat
 * @typedef {number} ConflictStatus
 */
const ConflictStatus = Object.freeze({
    UNKNOWN: 1,
    IDAT_INVALID: 2,
    TOKEN_INVALID: 3,
    IDAT_CONFLICT: 4
});

/**
 * Creates a new Patient.
 * @param {IDAT} idat - IDAT of the Patient. Can be created with {@link PseudonymizationService.createIDAT}.
 * @param {Object} mdat - MDAT of the Patient. For now, every Object is valid.
 * @returns {Patient} - The patient.
 */
PseudonymizationService.createPatient = function (idat, mdat) {

    const patient = {
        status: PatientStatus.CREATED,
        sureness: false,
        pseudonym: null,
        idat: idat,
        mdat: mdat,
        conflict: null
    };

    return patient;
}

/**
 * Creates a new IDAT Object and validates the data.
 * @param {string} firstname - First name of the patient.
 * @param {string} lastname - Lat name of the patient.
 * @param {string | number | Date} birthday - Birthday of the patient.
 * @returns {{idat: IDAT; valid: boolean; statusMessage: string;}}
 */
PseudonymizationService.createIDAT = function (firstname, lastname, birthday) {

    firstname = firstname.trim();
    lastname = lastname.trim();
    birthday = new Date(birthday);

    let valid = true;
    let statusMessage = "";

    if (firstname === "") {
        statusMessage = "Kein Vorname!";
        valid = false;
    } else if (lastname === "") {
        statusMessage = "Kein Nachname!";
        valid = false;
    } else if (isNaN(birthday)) {
        statusMessage = "Kein gültiger Geburtstag!";
        valid = false;
    }

    const idat = {
        firstname: firstname,
        lastname: lastname,
        birthday: birthday
    };

    return { idat, valid, statusMessage };
}

/**
 * 
 * @param {Map<patientId, Patient>} patients 
 * @param {patientId[]} [patientIds] 
 */
PseudonymizationService.getStatus = function (patients, patientIds) {

    if (!patientIds) patientIds = Array.from(patients.keys());

    const created = [];
    const conflicts = [];
    const pseudonymized = [];
    const handled = [];

    for (const key of patientIds) {
        const patient = patients.get(key);
        switch (patient.status) {
            case PatientStatus.CREATED:
                created.push(key);
                break;

            case PatientStatus.CONFLICT:
                conflicts.push(key);
                break;

            case PatientStatus.PSEUDONYMIZED:
                pseudonymized.push(key);
                break;

            case PatientStatus.HANDLED:
                handled.push(key);
                break;

            default:
                break;
        }
    }

    return { created, conflicts, pseudonymized, handled };
}

/**
 * Stores the given patients.
 * @param {Map<patientId, Patient>} patients - Map with the patients.
 * @param {patientId[]} [patientIds] - Array of patientIds of the patients to be stored.
 * @param {boolean} [status] - Indicates the status of the given patients.
 */
PseudonymizationService.storePatients = async function (patients, patientIds, status) {
    const handledIds = await handlePseudonymization(patients, patientIds, status);
    upload(patients, handledIds);
}

/**
 * Searches the given patients.
 * @param {Map<patientId, Patient>} patients - Map with the patients.
 * @param {patientId[]} [patientIds] - Array of patientIds of the patients to be stored.
 * @param {boolean} [status] - Indicates the status of the given patients.
 */
PseudonymizationService.searchPatients = async function (patients, patientIds, status) {
    const handledIds = await handlePseudonymization(patients, patientIds, status);
    search(patients, handledIds);
}

async function handlePseudonymization(patients, patientIds, status) {

    if (!patientIds) patientIds = Array.from(patients.keys());

    let handledIds;

    if (!status) {
        let { created, conflicts, pseudonymized, handled } = PseudonymizationService.getStatus(patients, patientIds);

        pseudonymized = pseudonymized.concat((await PseudonymizationService.createPseudonyms(patients, created)).pseudonymized);
        pseudonymized = pseudonymized.concat((await PseudonymizationService.resolveConflicts(patients, conflicts)).pseudonymized);

        handledIds = pseudonymized;
    } else {
        switch (status) {
            case PatientStatus.CREATED:
                handledIds = (await PseudonymizationService.createPseudonyms(patients, patientIds)).pseudonymized;
                break;

            case PatientStatus.CONFLICT:
                handledIds =  (await PseudonymizationService.resolveConflicts(patients, patientIds)).pseudonymized;
                break;

            case PatientStatus.PSEUDONYMIZED:
                handledIds =  patientIds;
                break;

            case PatientStatus.HANDLED:
            default:
                handledIds = [];
                break;
        }
    }

    return handledIds;
}

async function upload(patients, patientIds) {

    if (!patientIds) {
        // TODO
        return;
    }

    if (patientIds.length === 0) {
        return;
    }

    const dataArray = [];

    for (let i = 0; i < patientIds.length; ++i) {
        const patient = patients.get(patientIds[i]);

        dataArray.push({
            pseudonym: patient.pseudonym,
            mdat: JSON.stringify(patient.mdat)
        });
    }

    //const contextPath = "/pseudonymizer/";
    const requestURL = contextPath + "pseudonymization/patient";

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataArray)
    };

    const response = await fetch(requestURL, options).catch(error => console.error(error));

    // TODO: is a response form the server necessary?
}

/**
 * 
 * @param {Map<patientId, Patient} patients 
 * @param {patientId[]} patientIds 
 */
async function search(patients, patientIds) {

    if (!patientIds) {
        // TODO
        return;
    }

    if (patientIds.length === 0) {
        return;
    }

    const dataArray = [];

    for (let i = 0; i < patientIds.length; ++i) {
        dataArray.push(patients.get(patientIds[i]).pseudonym);
    }

    //const contextPath = "/pseudonymizer/";
    const requestURL = contextPath + "pseudonymization/mdat";

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataArray)
    };

    const response = await fetch(requestURL, options).catch(error => console.error(error));

    const mdatArray = await response.json();
    console.log(mdatArray);

    // TODO: Not working
    for (let i = 0; i < mdatArray.length; i++) {
        const mdatString = mdatArray[i];
        const patient = patients.get(patientIds[i]);
        patient.mdat = JSON.parse(mdatString);
        patient.status = PatientStatus.HANDLED;
        console.log(mdatString);
    }
}

/**
 * Creates pseudonyms for the given patients.
 * @param {Map<patientId, Patient>} patients 
 * @param {patientId[]} [patientIds] Array of keys.
 * @returns {Promise<{pseudonymized: patientId[]; conflicts: patientId[];}>} 
 */
PseudonymizationService.createPseudonyms = async function (patients, patientIds) {

    if (!patientIds) patientIds = Array.from(patients.keys());

    const pseudonymized = [];
    const conflicts = [];

    if (patientIds.length !== 0) {
        const urlArray = await getPseudonymizationURL(patientIds.length);

        for (let i = 0; i < patientIds.length; ++i) {
            const key = patientIds[i];
            const patient = patients.get(key);
            const success = await getPseudonym(urlArray[i], patient);

            if (success) {
                pseudonymized.push(key);
            } else {
                conflicts.push(key);
            }
        }
    }

    return { pseudonymized, conflicts };
}

/**
 * Resolves the conflicts of the patients.
 * @param {Map<patientId, Patient>} patients -
 * @param {patientId[]} [conflicts] -
 * @returns {Promise<{pseudonymized: patientId[]; conflicts: patientId[];}>} 
 */
PseudonymizationService.resolveConflicts = async function (patients, patientIds) {

    if (!patientIds) patientIds = Array.from(patients.keys());

    let pseudonymized = [];
    let conflicts = [];
    const invalidTokens = [];

    for (const key of patientIds) {
        const patient = patients.get(key);

        if (patient.conflict.statusCode === ConflictStatus.TOKEN_INVALID) {
            invalidTokens.push(key);
        } else {
            const success = await getPseudonym(patient.conflict.tokenURL, patient);

            if (success) {
                pseudonymized.push(key);
            } else {
                conflicts.push(key);
            }
        }
    }

    if (invalidTokens.length !== 0) {
        const { createdPseudonymized, createdConflicts } = await PseudonymizationService.createPseudonyms(patients, invalidTokens);
        pseudonymized = pseudonymized.concat(createdPseudonymized);
        conflicts = conflicts.concat(createdConflicts);
    }

    return { pseudonymized, conflicts };
}

/**
 * Creates the given amount of pseudonymisation urls.
 * One url contains one token and can be used for the pseudonymisation of one patient.
 * The URL gets invalid after some time specified int the Mainzelliste configuration.
 * @param {number} amount - Amount of requested pseudonymisation urls.
 * @returns {Promise<string[]>} - Array containing the urls.
 */
async function getPseudonymizationURL(amount) {

    //const contextPath = "/pseudonymizer/";
    const requestURL = contextPath + "pseudonymization/pseudonym/" + amount;

    const response = await fetch(requestURL).catch(error => console.error(error));

    if (typeof response === 'undefined' || !response.ok)
        return;

    return await response.json();
}

/**
 * Sets the pseudonym for the given patient.
 * The URL can be crated with the getPseudonymizationURL function.
 * 
 * If the pseudonymisation was not successful, the pseudonym property will stay unchanged.
 * Instead a Conflict will be created.
 * @param {string} requestURL - URL for the pseudonymisation.
 * @param {Patient} patient - Patient to get pseudonymized.
 * @returns {Promise<boolean>} - Returns whether the pseudonymazaiton was successful or not.
 * @see getPseudonymizationURL
 */
async function getPseudonym(requestURL, patient) {

    // This is important!
    // --------------------
    let birthDay = (patient.idat.birthday.getDate()).toString();
    let birthMonth = (patient.idat.birthday.getMonth() + 1).toString();

    if (birthDay.length === 1) {
        birthDay = "0" + birthDay;
    }

    if (birthMonth.length === 1) {
        birthMonth = "0" + birthMonth;
    }
    // --------------------

    const requestBody = "vorname=" + patient.idat.firstname +
        "&nachname=" + patient.idat.lastname +
        "&geburtstag=" + birthDay +
        "&geburtsmonat=" + birthMonth +
        "&geburtsjahr=" + patient.idat.birthday.getFullYear() +
        "&geburtsname=" +
        "&plz=" +
        "&ort=" +
        "&sureness=" + patient.sureness.toString() +
        "&anlegen=%2BPID%2Banfordern%2B";

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: requestBody
    };

    const response = await fetch(requestURL, options);

    patient.status = PatientStatus.CONFLICT;
    patient.conflict = {};

    if (typeof response === 'undefined') {
        patient.conflict.statusCode = ConflictStatus.UNKNOWN;
        patient.conflict.statusMessage = "Unexpected error!";
        patient.conflict.tokenURL = requestURL;
    }

    switch (response.status) {
        case 400:
            patient.conflict.statusCode = ConflictStatus.IDAT_INVALID;
            patient.conflict.statusMessage = await response.text();
            patient.conflict.tokenURL = requestURL;
            break;

        case 401:
            patient.conflict.statusCode = ConflictStatus.TOKEN_INVALID;
            patient.conflict.statusMessage = "Invalid token";
            patient.conflict.tokenURL = null;
            break;

        case 409:
            patient.conflict.statusCode = ConflictStatus.IDAT_CONFLICT;
            patient.conflict.statusMessage = "Conflict detected";
            patient.conflict.tokenURL = requestURL;
            break;

        default:
            const responseBody = await response.json();
            patient.pseudonym = responseBody.newId;
            patient.status = PatientStatus.PSEUDONYMIZED;
            patient.conflict = null;
    }

    return (patient.status === PatientStatus.PSEUDONYMIZED);
}
