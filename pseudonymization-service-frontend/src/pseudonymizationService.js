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
 * For now, every object with key - value pairs is valid.
 * @typedef {Object} MDAT
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
 * Id identifying a patient. Any type is allowed.
 * Only used in client side.
 * @typedef {*} patientId
 */

/**
 * The PatientStatus can have following values:
 * -3: The patient has an unsolved conflict.
 * -2: The stored tokenURL is invalid.
 * -1: The IDAT is invalid. This should be prevented by createIDAT.
 * 0: The patient got successful created and has valid IDAT.
 * 1: The pseudonym has benn created.
 * 11: The storing the MDAT was successful.
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
    // TODO rename e.g 'SEND', 'HANDLED'
    SAVED: 11,
    // TODO: Conflict with send data? e.g. 'NOT_SEND', 'NOT_HANDLED'
    FOUND: 21,
    NOT_FOUND: 22,
});

/**
 * This module is used to connect to the configured Pseudonymization service.
 * TODO: Maybe change patient into a class to prevent manuel changing the properties
 */
function PseudonymizationService(serverURL) {

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
    this.createPatient = function (firstname, lastname, birthday, mdat) {

        const idat = this.createIDAT(firstname, lastname, birthday);

        mdat = mdat ?? {};
        if (typeof mdat !== 'object' || Array.isArray(mdat))
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
   this.updateIDAT = function (patient, firstname, lastname, birthday) {

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
    this.createIDAT = function (firstname, lastname, birthday) {

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
    this.updateMDAT = function (patient, mdat) {
        mdat = mdat ?? {};
        patient.mdat = mdat;

        if (patient.status > 1)
            patient.status = PatientStatus.PSEUDONYMIZED;
    }

    /**
     * Searches patients with the given status.
     * @param {Map<patientId, Patient>} patients - Map with the patients.
     * @param {PatientStatus | PatientStatus[]} patientStatus - Status of the patients to be selected.
     * @param {patientId[]} [patientIds] - Array of patientIds of the patients to be considered.
     * @returns {patientId[]} - Ids of th found patients.
     */
    this.getPatients = function (patients, patientStatus, patientIds) {
        if (!Array.isArray(patientStatus))
            patientStatus = [patientStatus];

        patientIds = patientIds ?? Array.from(patients.keys());

        const result = [];

        for (const key of patientIds)
            if (patientStatus.includes(patients.get(key).status))
                result.push(key);

        return result;
    }

    /**
     * Stores the given patients.
     * @param {Map<patientId, Patient>} patients - Map with the patients.
     * @param {patientId[]} [patientIds=Array.from(patients.keys())] - Array of patientIds of the patients to be stored.
     * @param {boolean} [retrySucceeded=false] - Indicates if patients with status FOUND, NOT_FOUND, SAVED should be send again.
     * @throws Throws an exception if the pseudonymization server is not available.
     * @throws Throws an exception if the database is not available.
     */
    this.sendPatients = async function (patients, patientIds, retrySucceeded) {
        patientIds = patientIds ?? Array.from(patients.keys());
        retrySucceeded = retrySucceeded ?? false;

        const pseudonymizedIds = await handlePseudonymization(patients, patientIds, retrySucceeded);
        await send(patients, pseudonymizedIds);
    }

    /**
     * Requests the MDAT of the given patients.
     * @param {Map<patientId, Patient>} patients - Map with the patients.
     * @param {patientId[]} [patientIds=Array.from(patients.keys())] - Array of patientIds of the patients to be searched.
     * @param {boolean} [retrySucceeded=false] - Indicates if patients with status FOUND, NOT_FOUND, SAVED should be requested again.
     * @throws Throws an exception if the pseudonymization server is not available.
     * @throws Throws an exception if the server is not available.
     */
    this.requestPatients = async function (patients, patientIds, retrySucceeded) {
        patientIds = patientIds ?? Array.from(patients.keys());
        retrySucceeded = retrySucceeded ?? false;

        const pseudonymizedIds = await handlePseudonymization(patients, patientIds, retrySucceeded);
        await request(patients, pseudonymizedIds);
    }

    /**
     * Handles the pseudonymization of the given Patients.
     * If patientIds is null, every patient in the map will be handled.
     * Patients with status CREATED will be pseudonymized with createPseudonyms.
     * Patients with status CONFLICT will be pseudonymized with resolveConflicts.
     * Patients with status PSEUDONYMIZED be passed through.
     * Every other status will be ignored.
     * @param {Map<patientId, Patient>} patients - Map with the patients.
     * @param {patientId[]} patientIds - Array of patientIds of the patients to get pseudonymized.
     * @param {boolean} includeSucceeded - Indicates if patients with status FOUND, NOT_FOUND, SAVED should included.
     * @returns {Promise<patientId[]>} - Array with the patientIds of successful pseudonymized patients.
     * @throws Throws an exception if the pseudonymization server is not available.
     */
    async function handlePseudonymization(patients, patientIds, includeSucceeded) {
        const created = [];
        const conflicts = [];
        let pseudonymized = [];

        for (const key of patientIds) {
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

                case PatientStatus.FOUND:
                case PatientStatus.NOT_FOUND:
                case PatientStatus.SAVED:
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
     * Sends patients to the server.
     * The patients must have a pseudonym.
     * TODO: give response if the patient got send successfully.
     * TODO: Dynamic error message from the server
     * @param {Map<patientId, Patient>} patients - Map with patients.
     * @param {patientId[]} patientIds - Array of patientIds of the patients to be send.
     * @throws Throws an exception if the server is not available.
     */
    async function send(patients, patientIds) {
        if (patientIds.length === 0) return;

        const dataArray = [];

        for (let i = 0; i < patientIds.length; ++i) {
            const patient = patients.get(patientIds[i]);

            dataArray.push({
                pseudonym: patient.pseudonym,
                mdat: JSON.stringify(patient.mdat)
            });
        }

        const requestURL = serverURL + "api/patients/send";

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataArray)
        };

        const response = await fetch(requestURL, options);

        // TODO Throw different error for second condition
        if (typeof response === 'undefined' || !response.ok)
            throw new Error("Server not available");

        // TODO: is a response form the server necessary?
        for (const key of patientIds) {
            const patient = patients.get(key);
            patient.status = PatientStatus.SAVED;
        }
    }

    /**
     * Requests patients from the server and sets the mdat.
     * The patients must have a pseudonym.
     * TODO: Dynamic error message from the server
     * @param {Map<patientId, Patient>} patients - Map with patients.
     * @param {patientId[]} patientIds - Array of patientIds of the patients to get searched.
     * @throws Throws an exception if the server is not available.
     */
    async function request(patients, patientIds) {
        if (patientIds.length === 0) return;

        const dataArray = [];

        for (let i = 0; i < patientIds.length; ++i) {
            dataArray.push(patients.get(patientIds[i]).pseudonym);
        }

        const requestURL = serverURL + "api/patients/request";

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataArray)
        };

        const response = await fetch(requestURL, options);

        // TODO Throw different error for second condition
        if (typeof response === 'undefined' || !response.ok)
            throw new Error("Server not available");

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
     * @param {patientId[]} [patientIds] - PatientIds of the patients to get pseudonymized.
     * @returns {Promise<{pseudonymized: patientId[]; conflicts: patientId[];}>}
     * @throws Throws an exception if the pseudonymization server is not available.
     */
    async function createPseudonyms(patients, patientIds) {
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
     * @param {patientId[]} patientIds - PatientIds of the patients with conflicts to resolve.
     * @returns {Promise<{pseudonymized: patientId[]; conflicts: patientId[];}>} - PatientIds of the patients that got pseudonymized and that new conflicts
     * @throws Throws an exception if the pseudonymization server is not available.
     */
    async function resolveConflicts(patients, patientIds) {
        let pseudonymized = [];
        let conflicts = [];
        const invalidTokens = [];

        for (const key of patientIds) {
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
     * @returns {Promise<string[]>} - Array containing the urls.
     * @throws Throws an exception if the pseudonymization server is not available.
     */
    async function getPseudonymizationURL(amount) {
        const requestURL = serverURL + "api/tokens/addPatient/" + amount;

        const response = await fetch(requestURL);

        if (typeof response === 'undefined' || !response.ok)
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
     * @returns {Promise<boolean>} - Returns whether the pseudonymization was successful or not.
     * @throws Throws an exception if the pseudonymization server is not available.
     */
    async function getPseudonym(requestURL, patient) {

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
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: requestBody
        };

        const response = await fetch(requestURL, options);

        if (typeof response === "undefined")
            throw new Error("Can't connect to Mainzelliste!");

        switch (response.status) {
            case 201:
                const responseBody = await response.json();
                patient.pseudonym = responseBody.newId;
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

    return this;
}
