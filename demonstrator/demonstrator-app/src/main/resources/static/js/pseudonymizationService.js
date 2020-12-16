'use strict';

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
 * This library stores the mdat as a raw string.
 * The serverside and clientside applications can parse the mdat to a string and back to the desired type.
 * @typedef {string} MDAT
 */

/**
 * Object representing a patient.
 * @typedef {Object} Patient
 * @property {PatientStatus} status Status of the pseudonymization.
 * @property {boolean} sureness Sureness of the idat. See documentation of the Mainzelliste.
 * @property {string} pseudonym Pseudonym of this patient. null until it got created via createPseudonyms.
 * @property {IDAT} idat IDAT of this patient.
 * @property {MDAT} mdat MDAT of this patient. May be null.
 * @property {string} tokenURL Token used for the pseudonymization attempt. Can be reused until the conflict is resolved.
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
 * -3: The patient has an unsolved conflict.
 * -2: The stored tokenURL is invalid.
 * -1: The IDAT is invalid. This should be prevented by createIDAT.
 * 0: The patient got successful created and has valid IDAT.
 * 1: The pseudonym has benn created.
 * 11: The server processed the MDAT was successfully.
 * 12: The server did not processed the MDAT was successfully.
 * 21: Patient was successfully found in the database.
 * 22: There is no patient with the given IDAT.
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
 * This module is used to connect to the configured Pseudonymization service.
 * TODO: Maybe change patient into a class to prevent manuel changing the properties
 * @param {string} serverURL - URL of the MDAT server.
 * @param {string} [mainzellisteApiVersion=3.0] - Version of the Mainzelliste api to be used.
 */
function PseudonymizationService(serverURL, mainzellisteApiVersion) {
    mainzellisteApiVersion = mainzellisteApiVersion ?? "3.0";

    const service = {};

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
    service.createPatient = function (firstname, lastname, birthday, mdat) {

        const idat = this.createIDAT(firstname, lastname, birthday);

        mdat = mdat ?? "";
        if (typeof mdat !== 'string')
            throw new TypeError("Invalid MDAT!");

        const patient = {
            status: PatientStatus.CREATED,
            sureness: false,
            pseudonym: null,
            idat: idat,
            mdat: mdat,
            tokenURL: null
        };

        return patient;
    }

    /**
     * Validates Updates the IDAT of the given patient.
     * If the given IDAT is different from the current one and the patient has a pseudonym, the pseudonym well be reset and the status will be set to CREATED.
     * @param {Patient} patient - Patient to update.
     * @param {string} firstname - Firstname of the patient.
     * @param {string} lastname - Lastname of the patient.
     * @param {string | number | Date} birthday - Birthday of the patient.
     * @throws Throws an exception if the IDAT is not valid.
     */
    service.updateIDAT = function (patient, firstname, lastname, birthday) {

        const idat = this.createIDAT(firstname, lastname, birthday);

        if (patient.status > 0) {
            for (const key in patient.idat) {
                let equal = true;

                if (patient.idat[key] instanceof Date) {
                    equal = (patient.idat[key].getTime() === idat[key].getTime());
                } else {
                    equal = (patient.idat[key] === idat[key]);
                }

                if (!equal) {
                    patient.pseudonym = null;
                    patient.status = PatientStatus.CREATED;
                    break;
                }
            }
        }

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
    service.createIDAT = function (firstname, lastname, birthday) {

        if (typeof firstname !== "string" || firstname.trim() === "")
            throw new Error("Invalid firstname!");

        if (typeof lastname !== "string" || lastname.trim() === "")
            throw new Error("Invalid lastname!");

        if (typeof birthday !== "string" && typeof birthday !== "number" && !(birthday instanceof Date))
            throw new TypeError("Invalid birthday!");

        birthday = new Date(birthday);

        if (isNaN(birthday) || birthday.getTime() > new Date().getTime())
            throw new Error("Invalid birthday!");

        const idat = {
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            birthday: birthday
        };

        return idat;
    }

    /**
     * Sets the MDAT of the given patient.
     * If the patient got send or requested, the status will be set to PSEUDONYMIZED.
     * @param {Patient} patient - Patient to be updated.
     * @param {Object} [mdat={}] - MDAT of the Patient. For now, every Object is valid. Default is an empty object.
     */
    service.updateMDAT = function (patient, mdat) {
        mdat = mdat ?? "";
        patient.mdat = mdat;

        if (patient.status > 1)
            patient.status = PatientStatus.PSEUDONYMIZED;
    }

    /**
     * Searches patients with the given status.
     * @param {Map<patientKey, Patient>} patients - Map with the patients.
     * @param {PatientStatus | PatientStatus[]} patientStatus - Status of the patients to be selected.
     * @param {patientKey[]} [patientKeys] - Array of patientKeys of the patients to be considered.
     * @returns {patientKey[]} - Ids of th found patients.
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
     * @param {Map<patientKey, Patient>} patients - Map with the patients.
     * @param {patientKey[]} [patientKeys=Array.from(patients.keys())] - Array of patientKeys of the patients to be stored.
     * @param {boolean} [retrySucceeded=false] - Indicates if patients with status FOUND, NOT_FOUND, PROCESSED, NOT_PROCESSED should be send again.
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
     * @param {Map<patientKey, Patient>} patients - Map with the patients.
     * @param {patientKey[]} [patientKeys=Array.from(patients.keys())] - Array of patientKeys of the patients to be searched.
     * @param {boolean} [retrySucceeded=false] - Indicates if patients with status FOUND, NOT_FOUND, PROCESSED, NOT_PROCESSED should be requested again.
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
     * @param {string | string[]} pseudonyms - Pseudonyms to depseudonymize.
     * @returns {Promise<{depseudonymized: Map<string, IDAT>; invalid: string[];}>} Pseudonyms with IDAT and invalid pseudonyms.
     * @throws Throws an exception if the Mainzelliste is not available.
     * @throws Throws an exception if the server is not available.
     */
    service.depseudonymize = async function (pseudonyms) {
        if (!Array.isArray(pseudonyms))
            pseudonyms = [pseudonyms];

        const { depseudonymized, invalid } = await handleDepseudonymization(pseudonyms);
        return { depseudonymized, invalid };
    }

    /**
     * Handles the pseudonymization of the given Patients.
     * If patientKeys is null, every patient in the map will be handled.
     * Patients with status CREATED will be pseudonymized with createPseudonyms.
     * Patients with status CONFLICT will be pseudonymized with resolveConflicts.
     * Patients with status PSEUDONYMIZED be passed through.
     * Every other status will be ignored.
     * @param {Map<patientKey, Patient>} patients - Map with the patients.
     * @param {patientKey[]} patientKeys - Array of patientKeys of the patients to get pseudonymized.
     * @param {boolean} includeSucceeded - Indicates if patients with status FOUND, NOT_FOUND, PROCESSED, NOT_PROCESSED should included.
     * @returns {Promise<patientKey[]>} - Array with the patientKeys of successful pseudonymized patients.
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
                    if (includeSucceeded)
                        pseudonymized.push(key);
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
     * @param {string[]} pseudonyms - Pseudonyms to get depseudonymized.
     * @returns {Promise<{depseudonymized: Map<string, IDAT>; invalid: string[];}>} Pseudonyms with IDAT and invalid pseudonyms.
     * @throws Throws an exception if the Mainzelliste is not available.
     * @throws Throws an exception if the server is not available.
     */
    async function handleDepseudonymization(pseudonyms) {
        const depseudonymized = new Map();

        if (pseudonyms.length === 0)
            return { depseudonymized, invalid: [] };

        const { url, invalidPseudonyms } = await getDepseudonymizationURL(pseudonyms);

        if (url === "")
            return { depseudonymized, invalid: invalidPseudonyms };

        const responseArray = await getPatientData(url);

        for (const entry of responseArray) {
            const pseudonym = entry.ids[0].idString;
            const idat = service.createIDAT(entry.fields.vorname, entry.fields.nachname, entry.fields.geburtsjahr + "-" + entry.fields.geburtsmonat + "-" + entry.fields.geburtstag);
            depseudonymized.set(pseudonym, idat);
        }

        return { depseudonymized, invalid: invalidPseudonyms };
    }

    /**
     * Sends patients to the server.
     * The patients must have a pseudonym.
     * @param {Map<patientKey, Patient>} patients - Map with patients.
     * @param {patientKey[]} patientKeys - Array of patientKeys of the patients to be send.
     * @throws Throws an exception if the server is not available.
     */
    async function send(patients, patientKeys) {
        if (patientKeys.length === 0) return;

        const dataArray = [];

        for (const key of patientKeys) {
            const patient = patients.get(key);

            dataArray.push({
                pseudonym: patient.pseudonym,
                mdat: patient.mdat
            });
        }

        const requestURL = serverURL + "/patients/send/mdat";

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
     * @param {Map<patientKey, Patient>} patients - Map with patients.
     * @param {patientKey[]} patientKeys - Array of patientKeys of the patients to get searched.
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

        const mdatArray = await response.json();

        for (let i = 0; i < patientKeys.length; ++i) {
            const patient = patients.get(patientKeys[i]);
            const mdatString = mdatArray[patient.pseudonym];

            if (typeof mdatString === 'undefined') {
                patient.status = PatientStatus.NOT_FOUND;
            } else {
                patient.mdat = mdatString;
                patient.status = PatientStatus.FOUND;
            }
        }
    }

    /**
     * Creates pseudonyms for the given patients.
     * The patients must have the status CREATED.
     * @param {Map<patientKey, Patient>} patients - Map with patients.
     * @param {patientKey[]} [patientKeys] - PatientKeys of the patients to get pseudonymized.
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
                const success = await getPseudonym(response.urlTokens[i], patient, response.useCallback);

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
     * @param {Map<patientKey, Patient>} patients - Map with patients.
     * @param {patientKey[]} patientKeys - PatientKeys of the patients with conflicts to resolve.
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
                const success = await getPseudonym(patient.tokenURL, patient);

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
     * @param {number} amount - Amount of requested pseudonymization urls.
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
            body: amount
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
     * @param {string[]} pseudonyms - Pseudonyms to depseudonymize.
     * @returns {Promise<{url: string; invalidPseudonyms: string[];}>} URL for the depseudonymization and all invalid pseudonyms.
     * @throws Throws an exception if the server is not available.
     */
    async function getDepseudonymizationURL(pseudonyms) {
        const requestURL = serverURL + "/tokens/readPatients";

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pseudonyms)
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
     * @param {string} requestURL - URL for the pseudonymization.
     * @param {Patient} patient - Patient to get pseudonymized.
     * @param {boolean} useCallback - Indicates if the callback function of the Mainzelliste will be used.
     * @returns {Promise<boolean>} Returns whether the pseudonymization was successful or not.
     * @throws Throws an exception if the Mainzelliste is not available.
     */
    async function getPseudonym(requestURL, patient, useCallback) {

        // This is important!
        // --------------------
        let birthDay = (patient.idat.birthday.getDate()).toString();
        let birthMonth = (patient.idat.birthday.getMonth() + 1).toString();

        if (birthDay.length === 1)
            birthDay = "0" + birthDay;

        if (birthMonth.length === 1)
            birthMonth = "0" + birthMonth;
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
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'mainzellisteApiVersion': mainzellisteApiVersion
            },
            body: requestBody
        };

        const response = await fetch(requestURL, options);

        if (typeof response === "undefined")
            throw new Error("Can't connect to Mainzelliste!");

        switch (response.status) {
            case 201:
                const responseBody = await response.json();
                patient.pseudonym = (useCallback) ? requestURL.split("=")[1]
                    : (mainzellisteApiVersion === "1.0") ? responseBody.newId
                        : responseBody[0].idString
                patient.status = PatientStatus.PSEUDONYMIZED;
                patient.tokenURL = null;
                break;

            case 400:
                // IDAT is invalid
                // This case should never be true.
                // Invalid IDAT should be detected by createIDAT.
                patient.status = PatientStatus.IDAT_INVALID;
                patient.tokenURL = requestURL;
                console.error(await response.text());
                break;

            case 401:
                // The token is invalid
                patient.status = PatientStatus.TOKEN_INVALID;
                patient.tokenURL = null;
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
     * @param {string} requestURL - URL for the depseudonymization.
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
