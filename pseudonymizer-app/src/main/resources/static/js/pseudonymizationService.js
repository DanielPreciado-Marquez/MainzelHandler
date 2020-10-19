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
 * 11: The storing the MDAT was successful.
 * 21: Patient was successfully found in the database.
 * 22: There is no patient with the given IDAT.
 * @typedef {number} PatientStatus
 */
const PatientStatus = Object.freeze({
    CONFLICT: -1,
    CREATED: 0,
    PSEUDONYMIZED: 1,
    SAVED: 11,
    // TODO: Conflict with stored data? e.g. NOT_SAVED
    FOUND: 21,
    NOT_FOUND: 22,
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
 * Validates the idat.
 * @param {string} firstname - Firstname of the patient.
 * @param {string} lastname - Lastname of the patient.
 * @param {string | number | Date} birthday - Birthday of the patient.
 * @param {Object} [mdat={}] - MDAT of the Patient. For now, every Object is valid. Default is an empty object.
 * @returns {Patient} - The patient.
 * @throws Throws an exception if the IDAT is not valid.
 */
PseudonymizationService.createPatient = function (firstname, lastname, birthday, mdat) {

    const idat = this.createIDAT(firstname, lastname, birthday);

    if (!mdat) mdat = {};

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
 * Validates Updates the IDAT of the given patient.
 * @param {Patient} patient - Patient to update.
 * @param {string} firstname - Firstname of the patient.
 * @param {string} lastname - Lastname of the patient.
 * @param {string | number | Date} birthday - Birthday of the patient.
 * @throws Throws an exception if the IDAT is not valid.
 */
PseudonymizationService.updateIDAT = function (patient, firstname, lastname, birthday) {
    const idat = this.createIDAT(firstname, lastname, birthday);
    patient.idat = idat;
}

/**
 * Creates a new IDAT Object and validates the data.
 * @param {string} firstname - Firstname of the patient.
 * @param {string} lastname - Lastname of the patient.
 * @param {string | number | Date} birthday - Birthday of the patient.
 * @returns {IDAT} - Validated IDAT.
 * @throws Throws an exception if the IDAT is not valid.
 */
PseudonymizationService.createIDAT = function (firstname, lastname, birthday) {

    firstname = firstname.trim();
    lastname = lastname.trim();
    birthday = new Date(birthday);

    if (firstname === "") throw "Firstname is required!";
    if (lastname === "") throw "Lastname is required!";
    if (isNaN(birthday)) throw "Invalid birthday!";

    const idat = {
        firstname: firstname,
        lastname: lastname,
        birthday: birthday
    };

    return idat;
}

/**
 * Stores the given patients.
 * @param {Map<patientId, Patient>} patients - Map with the patients.
 * @param {patientId[]} [patientIds] - Array of patientIds of the patients to be stored.
 * @param {PatientStatus} [status] - Indicates the status of the given patients.
 * @throws Throws an exception if the pseudonymization server is not available.
 * @throws Throws an exception if the database is not available.
 */
PseudonymizationService.storePatients = async function (patients, patientIds, status) {
    const pseudonymizedIds = await handlePseudonymization(patients, patientIds, status);
    await store(patients, pseudonymizedIds);
}

/**
 * Searches the given patients.
 * @param {Map<patientId, Patient>} patients - Map with the patients.
 * @param {patientId[]} [patientIds] - Array of patientIds of the patients to be searched.
 * @param {PatientStatus} [status] - Indicates the status of the given patients.
 * @throws Throws an exception if the pseudonymization server is not available.
 * @throws Throws an exception if the database is not available.
 */
PseudonymizationService.searchPatients = async function (patients, patientIds, status) {
    const pseudonymizedIds = await handlePseudonymization(patients, patientIds, status);
    await search(patients, pseudonymizedIds);
}

/**
 * Handles the pseudonymisation of the given Patients.
 * If patientIds is null, every patient in the map will be handled.
 * If the status is given, every patient to be handled must have this PatientStatus.
 * Patients with status CREATED will be pseudonymized with createPseudonyms.
 * Patients with status CONFLICT will be pseudonymized with resolveConflicts.
 * Patients with status PSEUDONYMIZED be passed through.
 * Every other status will be ignored.
 * @param {Map<patientId, Patient>} patients - Map with the patients.
 * @param {patientId[]} [patientIds] - Array of patientIds of the patients to get pseudonymized.
 * @param {PatientStatus} [status] - Indicates the status of the given patients.
 * @returns {Promise<patientId[]>} - Array with the patientIds of successful pseudonymized patients.
 * @throws Throws an exception if the pseudonymization server is not available.
 */
async function handlePseudonymization(patients, patientIds, status) {

    if (!patientIds) patientIds = Array.from(patients.keys());

    let pseudonymizedIds;

    if (!status) {
        const created = [];
        const conflicts = [];
        let pseudonymized = [];

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

                default:
                    break;
            }
        }

        pseudonymized = pseudonymized.concat((await PseudonymizationService.createPseudonyms(patients, created)).pseudonymized);
        pseudonymized = pseudonymized.concat((await PseudonymizationService.resolveConflicts(patients, conflicts)).pseudonymized);

        pseudonymizedIds = pseudonymized;
    } else {
        switch (status) {
            case PatientStatus.CREATED:
                pseudonymizedIds = (await PseudonymizationService.createPseudonyms(patients, patientIds)).pseudonymized;
                break;

            case PatientStatus.CONFLICT:
                pseudonymizedIds = (await PseudonymizationService.resolveConflicts(patients, patientIds)).pseudonymized;
                break;

            case PatientStatus.PSEUDONYMIZED:
                pseudonymizedIds = patientIds;
                break;

            default:
                pseudonymizedIds = [];
                break;
        }
    }

    return pseudonymizedIds;
}

/**
 * Stores patients in the database.
 * The patients must have a pseudonym.
 * Needs the variable 'contextPath' with the url of the pseudonymization server.
 *
 * TODO: give response if the patient got stored successfully.
 *
 * @param {Map<patientId, Patient>} patients - Map with patients.
 * @param {patientId[]} patientIds - Array of patientIds of the patients to be stored.
 * @throws Throws an exception if the database is not available.
 */
async function store(patients, patientIds) {

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

    const requestURL = contextPath + "api/patients/save";

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataArray)
    };

    const response = await fetch(requestURL, options);

    if (typeof response === 'undefined' || !response.ok) throw "Database not available";

    // TODO: is a response form the server necessary?
}

/**
/**
 * Searches patients in the database and sets the mdat.
 * The patients must have a pseudonym.
 * Needs the variable 'contextPath' with the url of the pseudonymization server.
 * @param {Map<patientId, Patient>} patients - Map with patients.
 * @param {patientId[]} patientIds - Array of patientIds of the patients to get searched.
 * @throws Throws an exception if the database is not available.
 */
async function search(patients, patientIds) {

    if (patientIds.length === 0) {
        return;
    }

    const dataArray = [];

    for (let i = 0; i < patientIds.length; ++i) {
        dataArray.push(patients.get(patientIds[i]).pseudonym);
    }

    const requestURL = contextPath + "api/patients/load";

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataArray)
    };

    const response = await fetch(requestURL, options);

    if (typeof response === 'undefined' || !response.ok) throw "Database not available";

    const mdatArray = await response.json();

    for (let i = 0; i < mdatArray.length; i++) {
        const patient = patients.get(patientIds[i]);
        const mdatString = mdatArray[i];

        if (mdatString === "") {
            patient.status = PatientStatus.NOT_FOUND;
        } else {
            patient.mdat = JSON.parse(mdatString);
            patient.status = PatientStatus.FOUND;
        }
    }
}

/**
 * Creates pseudonyms for the given patients.
 * The patients must have the status CREATED.
 * @param {Map<patientId, Patient>} patients - Map with patients.
 * @param {patientId[]} [patientIds] - Array of patientIds of the patients to get pseudonymized.
 * @returns {Promise<{pseudonymized: patientId[]; conflicts: patientId[];}>}
 * @throws Throws an exception if the pseudonymization server is not available.
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
 * Resolves conflicts of patients.
 * The patients must have a conflict.
 * @param {Map<patientId, Patient>} patients - Map with patients.
 * @param {patientId[]} [conflicts] - Array of patientIds of the patients with conflicts to resolve.
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
 * @throws Throws an exception if the pseudonymization server is not available.
 */
async function getPseudonymizationURL(amount) {
    const requestURL = contextPath + "api/tokens/addPatient/" + amount;

    const response = await fetch(requestURL);

    if (typeof response === 'undefined' || !response.ok) throw await response.text();

    return await response.json();
}

/**
 * Sets the pseudonym for the given patient.
 * The URL can be crated with the getPseudonymizationURL function.
 * 
 * If the pseudonymisation was not successful, the pseudonym property will stay unchanged and a Conflict will be created.
 * @param {string} requestURL - URL for the pseudonymisation.
 * @param {Patient} patient - Patient to get pseudonymized.
 * @returns {Promise<boolean>} - Returns whether the pseudonymazaiton was successful or not.
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
            // This case should never be true.
            // Invalid IDAT should be detected by createIDAT.
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
