'use strict';

/**
 * The IDAT of a patient.
 * Stores the identifying data.
 * @typedef {Object} IDAT
 */

/**
 * The MDAT of a patient.
 * Stores the medical data.
 * This library stores the mdat as a raw string.
 * The serverside and clientside applications can parse the mdat to a string and back to the desired type.
 * @typedef {string} MDAT
 */

/**
 * Object representing a patient.
 * @typedef {Object} Patient
 * @property {IDAT} idat IDAT of this patient.
 * @property {MDAT} mdat MDAT of this patient. May be null.
 * @property {string} pseudonym Pseudonym of this patient. null until it got created via createPseudonyms.
 * @property {boolean} sureness Sureness of the idat. See documentation of the Mainzelliste.
 * @property {PatientStatus} status Status of the pseudonymization.
 * @property {boolean} tentative Tentative value from the pseudonymization.
 * @property {string} tokenURL Token used for the pseudonymization attempt. Can be reused until the conflict is resolved.
 * @property {boolean} tokenUseCallback Whether the token uses the callback function.
 */

/**
 * Key identifying a patient. Any type is allowed.
 * Only used in client side.
 * @typedef {*} patientKey
 */

/**
 * Object returned by the mainzelliste after a depseudonymization request.
 * @typedef {Object} DepseudonymizationResponse
 * @property {{vorname: string; nachname: string; geburtstag: string, geburtsmonat: string; geburtsjahr: string;}} fields
 * @property {[{idType: string; idString: string; tentative: boolean}]} ids
 */

/**
 * The PatientStatus can have following values:
 * - -3: The patient has an unsolved conflict.
 * - -2: The stored tokenURL is invalid.
 * - -1: The IDAT is invalid.
 * - 0: The patient got successful created and has valid IDAT.
 * - 1: The pseudonym has benn created.
 * - 11: The server processed the MDAT was successfully.
 * - 12: The server did not processed the MDAT was successfully.
 * - 21: Patient was successfully found in the database.
 * - 22: There is no patient with the given IDAT.
 * @typedef {number} PatientStatus
 */
const PatientStatus = Object.freeze({
    IDAT_CONFLICT: -3,
    TOKEN_INVALID: -2,
    IDAT_INVALID: -1,
    CREATED: 0,
    PSEUDONYMIZED: 1,
    PROCESSED: 11,
    NOT_PROCESSED: 12,
    FOUND: 21,
    NOT_FOUND: 22,
});

/**
 * Field in the IDAT.
 * @typedef {Object} IDATEntry
 * @property {string} type Type of the field. Valid are 'string' and 'number'.
 * @property {boolean} required Wether the field is required or not.
 * @property {boolean} [fixMonth=false] Shifts the month by one to fix the string representation.
 * @property {boolean} [fixZero=false] Fills the string representation of a number with a zero if the number has only one digit. Useful for days and months.
 */

/**
 * @typedef {Object} PseudonymHandlerConfig
 * @property {string} [mainzellisteApiVersion=3.0] Version of the Mainzelliste api to be used. Default is 3.0.
 * @property {Object.<string, IDATEntry>} idatFields Field definitions of the Maintelliste.
 * @property {string} serverURL URL of the MDAT server.
 */

/**
 * This module is used to connect to the configured Pseudonymization service.
 * TODO: Maybe change patient into a class to prevent manuel changing the properties
 * @param {PseudonymHandlerConfig} pseudonymHandlerConfig Configurations.
 */
function PseudonymHandler(pseudonymHandlerConfig) {
    const mainzellisteApiVersion = pseudonymHandlerConfig.mainzellisteApiVersion ?? "3.0";
    const idatFields = pseudonymHandlerConfig.idatFields;
    const serverURL = pseudonymHandlerConfig.serverURL;

    const service = {};

    /**
     * Creates a new Patient.
     * Validates the IDAT.
     * @param {IDAT} idat IDAT of the patient.
     * @param {string} [mdat=""] MDAT of the Patient as a string. Default is an empty string.
     * @returns {Patient} The patient.
     * @throws Throws an exception if the IDAT is not valid.
     */
    service.createPatient = function (idat, mdat) {
        mdat ??= "";

        if (typeof mdat !== 'string')
            throw new TypeError("MDAT must be of the type 'string' but is type of '" + typeof mdat + "'!");

        this.validateIDAT(idat);

        const patient = {
            status: PatientStatus.CREATED,
            sureness: false,
            pseudonym: null,
            idat: idat,
            mdat: mdat,
            tentative: false,
            tokenURL: null,
            tokenUseCallback: null
        };

        return patient;
    }

    /**
     * Validates Updates the IDAT of the given patient.
     * If the given IDAT is different from the current one and the patient has a pseudonym, the pseudonym well be reset and the status will be set to CREATED.
     * @param {Patient} patient Patient to update.
     * @param {IDAT} idat New IDAT object.
     * @throws Throws an exception if the IDAT is not valid.
     */
    service.updateIDAT = function (patient, idat) {
        let changed = false;

        for (const fieldName in idat) {
            const oldValue = patient.idat[fieldName];
            const newValue = idat[fieldName];
            const fieldDef = idatFields[fieldName];

            if (oldValue == null && newValue != null) {
                if (fieldDef == null)
                    throw new Error("Field with name '" + fieldName + "' is not a valid idat field!");

                if (typeof newValue !== fieldDef.type)
                    throw new Error("Field with name '" + fieldName + "' of the type '" + typeof newValue + "' must be of the type '" + fieldDef.type + "'!");

                changed = true;
                patient.idat[fieldName] = newValue;
            } else if (oldValue !== newValue) {
                changed = true;

                if (newValue == null) {
                    if (fieldDef.required)
                        throw new Error("Field with name '" + fieldName + "' can not get deleted because it is required!");

                    delete patient.idat[fieldName];
                } else {
                    if (typeof newValue !== fieldDef.type)
                        throw new Error("Field with name '" + fieldName + "' of the type '" + typeof newValue + "' must be of the type '" + fieldDef.type + "'!");

                    patient.idat[fieldName] = newValue;
                }
            }
        }

        if (patient.status > 0 && changed) {
            patient.pseudonym = null;
            patient.status = PatientStatus.CREATED;
        }
    }

    /**
     * Creates a new IDAT Object and validates the data.
     * @param {any[]} idatValues Values of the IDAT.
     * @returns {IDAT} Validated IDAT.
     * @throws Throws an exception if the IDAT is not valid.
     */
    service.createIDAT = function (...idatValues) {
        let idat = {};

        let i = 0;
        for (const idatField in idatFields)
            idat[idatField] = idatValues[i++];

        this.validateIDAT(idat);
        return idat;
    }

    /**
     * Validates an IDAT-Object fulfills the configured requirements.
     * @param {IDAT} idat Idat to be validated.
     * @throws Throws an exception if the IDAT is not valid.
     */
    service.validateIDAT = function (idat) {
        for (const idatField in idatFields) {
            const field = idatFields[idatField];
            const value = idat[idatField];

            if (value == null) {
                if (field.required)
                    throw new Error("Field with name '" + idatField + "' is not present but required!");
            }
            else if (typeof value !== field.type)
                throw new Error("Field with name '" + idatField + "' of the type '" + typeof value + "' must be of the type '" + field.type + "'!");
        }

        for (const key in idat)
            if (idatFields[key] == null)
                throw new Error("Field with name '" + key + "' is not a valid idat field!");
    }

    /**
     * Sets the MDAT of the given patient.
     * If the patient got send or requested, the status will be set to PSEUDONYMIZED.
     * @param {Patient} patient Patient to be updated.
     * @param {string} [mdat=""] MDAT of the Patient as a string. Default is an empty string.
     */
    service.updateMDAT = function (patient, mdat = "") {
        if (patient.mdat !== mdat) {
            patient.mdat = mdat;

            if (patient.status > 1)
                patient.status = (patient.status !== PatientStatus.PSEUDONYMIZED && patient.tokenUseCallback === true) ? PatientStatus.CREATED : PatientStatus.PSEUDONYMIZED;
        }
    }

    /**
     * Searches patients with the given status.
     * @param {Map<patientKey, Patient>} patients Map with the patients.
     * @param {PatientStatus | PatientStatus[]} patientStatus Status of the patients to be selected.
     * @param {patientKey[]} [patientKeys] Array of patientKeys of the patients to be considered.
     * @returns {patientKey[]} Ids of the found patients.
     */
    service.getPatients = function (patients, patientStatus, patientKeys) {
        if (!Array.isArray(patientStatus))
            patientStatus = [patientStatus];

        patientKeys = patientKeys ?? Array.from(patients.keys());

        const result = [];

        for (const key of patientKeys)
            if (patientStatus.includes(patients.get(key).status))
                result.push(key);

        return result;
    }

    /**
     * Stores the given patients.
     * @param {Map<patientKey, Patient>} patients Map with the patients.
     * @param {patientKey[]} [patientKeys=Array.from(patients.keys())] Array of patientKeys of the patients to be stored. By default every patient in the map will be send.
     * @param {boolean} [retrySucceeded=false] Indicates if patients with status FOUND, NOT_FOUND, PROCESSED, NOT_PROCESSED should be send again. Default is false.
     * @throws Throws an exception if the pseudonymization server is not available.
     * @throws Throws an exception if the database is not available.
     */
    service.sendPatients = async function (patients, patientKeys, retrySucceeded) {
        patientKeys = patientKeys ?? Array.from(patients.keys());
        retrySucceeded = retrySucceeded ?? false;

        const pseudonymizedIds = await handlePseudonymization(patients, patientKeys, retrySucceeded);
        await send(patients, pseudonymizedIds);
    }

    /**
     * Requests the MDAT of the given patients.
     * @param {Map<patientKey, Patient>} patients Map with the patients.
     * @param {patientKey[]} [patientKeys=Array.from(patients.keys())] Array of patientKeys of the patients to be searched. By default every patient in the map will be searched.
     * @param {boolean} [retrySucceeded=false] Indicates if patients with status FOUND, NOT_FOUND, PROCESSED, NOT_PROCESSED should be requested again. Default is false.
     * @throws Throws an exception if the Mainzelliste is not available.
     * @throws Throws an exception if the server is not available.
     */
    service.requestPatients = async function (patients, patientKeys, retrySucceeded) {
        patientKeys = patientKeys ?? Array.from(patients.keys());
        retrySucceeded = retrySucceeded ?? false;

        const pseudonymizedIds = await handlePseudonymization(patients, patientKeys, retrySucceeded);
        await request(patients, pseudonymizedIds);
    }

    /**
     * Depseudonymizes pseudonyms.
     * Returns a map containing the pseudonyms with the corresponding IDAT and an array containing all the pseudonyms without an IDAT.
     * @param {string | string[]} pseudonyms Pseudonyms to depseudonymize.
     * @param {string | string[]} [resultFields] IDAT fields to return. By default, every field will be returned.
     * @returns {Promise<{depseudonymized: Map<string, {idat: IDAT; tentative: boolean;}>; invalid: string[];}>} Pseudonyms with IDAT and invalid pseudonyms.
     * @throws Throws an exception if the Mainzelliste is not available.
     * @throws Throws an exception if the server is not available.
     */
    service.depseudonymize = async function (pseudonyms, resultFields) {
        if (!Array.isArray(pseudonyms))
            pseudonyms = [pseudonyms];

        if (resultFields != null && !Array.isArray(resultFields))
            resultFields = [resultFields];

        const { depseudonymized, invalid } = await handleDepseudonymization(pseudonyms, resultFields);
        return { depseudonymized, invalid };
    }

    /**
     * Handles the pseudonymization of the given Patients.
     * If patientKeys is null, every patient in the map will be handled.
     * Patients with status CREATED will be pseudonymized with createPseudonyms.
     * Patients with status CONFLICT will be pseudonymized with resolveConflicts.
     * Patients with status PSEUDONYMIZED will be passed through.
     * Every other status will be ignored or if includeSucceeded is true will be depending on the callback function pseudonymized or passed through.
     * @param {Map<patientKey, Patient>} patients Map with the patients.
     * @param {patientKey[]} patientKeys Array of patientKeys of the patients to get pseudonymized.
     * @param {boolean} includeSucceeded Indicates if patients with status FOUND, NOT_FOUND, PROCESSED, NOT_PROCESSED should included.
     * @returns {Promise<patientKey[]>} Array with the patientKeys of successful pseudonymized patients.
     * @throws Throws an exception if the Mainzelliste is not available.
     * @throws Throws an exception if the server is not available.
     */
    async function handlePseudonymization(patients, patientKeys, includeSucceeded) {
        const created = [];
        const conflicts = [];
        let pseudonymized = [];

        for (const key of patientKeys) {
            const patient = patients.get(key);

            switch (patient.status) {
                case PatientStatus.CREATED:
                    created.push(key);
                    break;

                case PatientStatus.IDAT_CONFLICT:
                case PatientStatus.TOKEN_INVALID:
                case PatientStatus.IDAT_INVALID:
                    conflicts.push(key);
                    break;

                case PatientStatus.PSEUDONYMIZED:
                    pseudonymized.push(key);
                    break;

                case PatientStatus.PROCESSED:
                case PatientStatus.NOT_PROCESSED:
                case PatientStatus.FOUND:
                case PatientStatus.NOT_FOUND:
                    if (includeSucceeded) {
                        if (patient.tokenUseCallback === true) {
                            created.push(key);
                        } else {
                            pseudonymized.push(key);
                        }
                    }
                    break;

                default:
                    break;
            }
        }

        pseudonymized = pseudonymized.concat((await createPseudonyms(patients, created)).pseudonymized);
        pseudonymized = pseudonymized.concat((await resolveConflicts(patients, conflicts)).pseudonymized);

        return pseudonymized;
    }

    /**
     * Depseudonymizes the given pseudonyms
     * @param {string[]} pseudonyms Pseudonyms to get depseudonymized.
     * @param {string[]} [resultFields] IDAT fields to return. By default, every field will be returned.
     * @returns {Promise<{depseudonymized: Map<string, {idat: IDAT; tentative: boolean;}>; invalid: string[];}>} Pseudonyms with IDAT and invalid pseudonyms.
     * @throws Throws an exception if the Mainzelliste is not available.
     * @throws Throws an exception if the server is not available.
     */
    async function handleDepseudonymization(pseudonyms, resultFields) {
        const depseudonymized = new Map();

        if (pseudonyms.length === 0)
            return { depseudonymized, invalid: [] };

        const { url, invalidPseudonyms } = await getDepseudonymizationURL(pseudonyms, resultFields);

        if (url === "")
            return { depseudonymized, invalid: invalidPseudonyms };

        const responseArray = await getPatientData(url);

        for (const entry of responseArray) {
            const pseudonym = entry.ids[0].idString;

            const idat = {};

            for (const field in entry.fields) {
                const idatField = idatFields[field];
                let value = entry.fields[field];
                if (idatField.type === 'number') {
                    value = Number(value);
                    if (idatField.fixMonth)
                        value--;
                } else if (idatField.fixMonth) {
                    value = (Number(value) - 1).toString();
                    if (value.length === 1)
                        value = '0' + value;
                }
                idat[field] = value;
            }

            const tentative = entry.ids[0].tentative;
            depseudonymized.set(pseudonym, { idat, tentative });
        }

        return { depseudonymized, invalid: invalidPseudonyms };
    }

    /**
     * Sends patients to the server.
     * The patients must have a pseudonym.
     * @param {Map<patientKey, Patient>} patients Map with patients.
     * @param {patientKey[]} patientKeys Array of patientKeys of the patients to be send.
     * @throws Throws an exception if the server is not available.
     */
    async function send(patients, patientKeys) {
        if (patientKeys.length === 0) return;

        const dataArray = [];

        for (const key of patientKeys) {
            const patient = patients.get(key);

            dataArray.push({
                pseudonym: patient.pseudonym,
                mdat: patient.mdat,
                tentative: patient.tentative
            });
        }

        const requestURL = serverURL + "/patients/send";

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataArray)
        };

        const response = await fetch(requestURL, options);

        if (typeof response === 'undefined')
            throw new Error("Server not available");

        if (!response.ok)
            throw new Error(await response.text());

        const successArray = await response.json();

        for (let i = 0; i < patientKeys.length; i++) {
            const patient = patients.get(patientKeys[i]);
            patient.status = successArray[patient.pseudonym] ? PatientStatus.PROCESSED : PatientStatus.NOT_PROCESSED;
        }
    }

    /**
     * Requests patients from the server and sets the mdat.
     * The patients must have a pseudonym.
     * @param {Map<patientKey, Patient>} patients Map with patients.
     * @param {patientKey[]} patientKeys Array of patientKeys of the patients to get searched.
     * @throws Throws an exception if the server is not available.
     */
    async function request(patients, patientKeys) {
        if (patientKeys.length === 0) return;

        const dataArray = [];

        for (let i = 0; i < patientKeys.length; ++i) {
            dataArray.push(patients.get(patientKeys[i]).pseudonym);
        }

        const requestURL = serverURL + "/patients/request";

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataArray)
        };

        const response = await fetch(requestURL, options);

        if (typeof response === 'undefined')
            throw new Error("Server not available");

        if (!response.ok)
            throw new Error(await response.text());

        const receivedPatients = await response.json();

        for (const patientKey of patientKeys) {
            const patient = patients.get(patientKey);
            let correspondingPatient = -1;

            for (const receivedPatient of receivedPatients) {
                if (receivedPatient.pseudonym === patient.pseudonym) {
                    correspondingPatient = receivedPatient;
                    break;
                }
            }

            if (correspondingPatient === -1) {
                patient.status = PatientStatus.NOT_FOUND;
            } else {
                patient.mdat = correspondingPatient.mdat;
                patient.status = PatientStatus.FOUND;
            }
        }
    }

    /**
     * Creates pseudonyms for the given patients.
     * The patients must have the status CREATED.
     * @param {Map<patientKey, Patient>} patients Map with patients.
     * @param {patientKey[]} [patientKeys] PatientKeys of the patients to get pseudonymized.
     * @returns {Promise<{pseudonymized: patientKey[]; conflicts: patientKey[];}>} Arrays of keys that got pseudonymized have a conflict.
     * @throws Throws an exception if the Mainzelliste is not available.
     * @throws Throws an exception if the server is not available.
     */
    async function createPseudonyms(patients, patientKeys) {
        const pseudonymized = [];
        const conflicts = [];

        if (patientKeys.length !== 0) {
            const response = await getPseudonymizationURL(patientKeys.length);

            for (let i = 0; i < patientKeys.length; ++i) {
                const key = patientKeys[i];
                const patient = patients.get(key);
                patient.tokenUseCallback = response.useCallback;
                patient.tokenURL = response.urlTokens[i];
                const success = await getPseudonym(patient);

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
     * @param {Map<patientKey, Patient>} patients Map with patients.
     * @param {patientKey[]} patientKeys PatientKeys of the patients with conflicts to resolve.
     * @returns {Promise<{pseudonymized: patientKey[]; conflicts: patientKey[];}>} PatientKeys of the patients that got pseudonymized and that new conflicts
     * @throws Throws an exception if the Mainzelliste is not available.
     * @throws Throws an exception if the server is not available.
     */
    async function resolveConflicts(patients, patientKeys) {
        let pseudonymized = [];
        let conflicts = [];
        const invalidTokens = [];

        for (const key of patientKeys) {
            const patient = patients.get(key);

            if (patient.statusCode === PatientStatus.TOKEN_INVALID) {
                invalidTokens.push(key);
            } else {
                const success = await getPseudonym(patient);

                if (success) {
                    pseudonymized.push(key);
                } else {
                    conflicts.push(key);
                }
            }
        }

        if (invalidTokens.length !== 0) {
            const { createdPseudonymized, createdConflicts } = await createPseudonyms(patients, invalidTokens);
            pseudonymized = pseudonymized.concat(createdPseudonymized);
            conflicts = conflicts.concat(createdConflicts);
        }

        return { pseudonymized, conflicts };
    }

    /**
     * Creates the given amount of pseudonymization urls.
     * One url contains one token and can be used for the pseudonymization of one patient.
     * The URL gets invalid after some time specified in the Mainzelliste configuration.
     * @param {number} amount Amount of requested pseudonymization urls.
     * @returns {Promise<{useCallback: boolean; urlTokens: string[];}>} Array containing the urls.
     * @throws Throws an exception if the server is not available.
     */
    async function getPseudonymizationURL(amount) {
        const requestURL = serverURL + "/tokens/addPatient";

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount })
        };

        const response = await fetch(requestURL, options);

        if (typeof response === 'undefined')
            throw new Error("Server not available");

        if (!response.ok)
            throw new Error(await response.text());

        return await response.json();
    }

    /**
     * Creates a depseudonymization url for the given pseudonyms.
     * Can be used to request the IDAT of all givane and valid pseudonyms.
     * Returns the url and a list containing all invalid pseudonyms
     * that can't get depseudonymized with the returned url.
     * Duplicated pseudonyms will be removed.
     * @param {string[]} pseudonyms Pseudonyms to depseudonymize.
     * @param {string[]} [resultFields=[]] IDAT fields to return. By default, every field will be returned.
     * @returns {Promise<{url: string; invalidPseudonyms: string[];}>} URL for the depseudonymization and all invalid pseudonyms.
     * @throws Throws an exception if the server is not available.
     */
    async function getDepseudonymizationURL(pseudonyms, resultFields = []) {
        const requestURL = serverURL + "/tokens/readPatients";

        if (resultFields.length === 0)
            for (const idatField in idatFields)
                resultFields.push(idatField);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pseudonyms, resultFields })
        };

        const response = await fetch(requestURL, options);

        if (typeof response === 'undefined')
            throw new Error("Server not available");

        if (!response.ok)
            throw new Error(await response.text());

        return await response.json();
    }

    /**
     * Sets the pseudonym for the given patient.
     * The requestURL can be crated with getPseudonymizationURL.
     * Sets the status to the result of the pseudonymization.
     * If a conflict with the IDAT occurs, the tokenURL will be set.
     * @param {Patient} patient Patient to get pseudonymized.
     * @returns {Promise<boolean>} Returns whether the pseudonymization was successful or not.
     * @throws Throws an exception if the Mainzelliste is not available.
     */
    async function getPseudonym(patient) {
        let requestBody = "";

        for (const idatField in idatFields) {
            const value = patient.idat[idatField];
            const field = idatFields[idatField];

            if (value == null)
                requestBody += idatField + "=&";
            else {
                let valueString;

                if (field.fixMonth)
                    valueString = (Number(value) + 1).toString();
                else
                    valueString = value.toString();

                if (field.fixZero && valueString.length === 1)
                    requestBody += idatField + "=0" + valueString + "&";
                else
                    requestBody += idatField + "=" + valueString + "&";
            }
        }

        requestBody += "sureness=" + patient.sureness.toString();

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'mainzellisteApiVersion': mainzellisteApiVersion
            },
            body: requestBody
        };

        const requestURL = patient.tokenURL;
        const response = await fetch(requestURL, options);

        if (typeof response === "undefined")
            throw new Error("Can't connect to Mainzelliste!");

        switch (response.status) {
            case 201:
                const responseBody = await response.json();
                patient.pseudonym = (patient.tokenUseCallback) ? requestURL.split("=")[1]
                    : (mainzellisteApiVersion === "1.0") ? responseBody.newId
                        : responseBody[0].idString;
                patient.status = PatientStatus.PSEUDONYMIZED;
                patient.tentative = responseBody[0].tentative;
                patient.tokenURL = null;
                break;

            case 400:
                // IDAT is invalid
                patient.status = PatientStatus.IDAT_INVALID;
                patient.tokenURL = requestURL;
                console.error(await response.text());
                break;

            case 401:
                // The token is invalid
                patient.status = PatientStatus.TOKEN_INVALID;
                patient.tokenURL = null;
                patient.tokenUseCallback = null;
                break;

            case 409:
                // Conflicting IDAT
                patient.status = PatientStatus.IDAT_CONFLICT;
                patient.tokenURL = requestURL;
                break;

            default:
                throw new Error(await response.text());
        }

        return (patient.status === PatientStatus.PSEUDONYMIZED);
    }

    /**
     * Requests the IDAT of the patients associated with the token contained in the requestURL.
     * @param {string} requestURL URL for the depseudonymization.
     * @returns {Promise<DepseudonymizationResponse[]>} Response from the Mainzelliste.
     * @throws Throws an exception if the Mainzelliste is not available.
     */
    async function getPatientData(requestURL) {

        const options = {
            method: 'GET',
            headers: {
                'mainzellisteApiVersion': mainzellisteApiVersion
            },
        };

        const response = await fetch(requestURL, options);

        if (typeof response === 'undefined')
            throw new Error("Can't connect to Mainzelliste!");

        if (!response.ok)
            throw new Error(await response.text());

        return await response.json();
    }

    return service;
}

export { PatientStatus, PseudonymHandler };
