'use strict';

import { PatientStatus, Mainzelhandler } from "./mainzelhandler.js";
import config from "./mainzelhandlerConfig.js";

/**
 * @type {Map<patientKey, Patient>}
 */
var patients = new Map();
var nextKey = 0;
var mainzelhandler;

window.onload = function () {
    config.serverURL = contextPath + requestPath;
    mainzelhandler = new Mainzelhandler(config);

    updateList();

    document.getElementById("add-patient").addEventListener("click", createPatient);
    document.getElementById("pseudonym-button").addEventListener("click", updatePseudonyms);
}

function createPatient() {

    const patientForm = document.getElementById("patient-form");
    const key = parseInt(patientForm["key-input"].value);

    const birthDate = new Date(patientForm["birthday-input"].value);
    const birthDay = birthDate.getDate();
    const birthMonth = birthDate.getMonth();
    const birthYear = birthDate.getFullYear();

    // const birthDate = patientForm["birthday-input"].value.split('-');
    // const birthDay = birthDate[2];
    // const birthMonth = birthDate[1];
    // const birthYear = birthDate[0];

    try {
        const idat = mainzelhandler.createIDAT(patientForm["firstname-input"].value, patientForm["lastname-input"].value, birthDay, birthMonth, birthYear);

        if (key !== "" && patients.has(key)) {
            const patient = patients.get(key);
            mainzelhandler.updateIDAT(patient, idat);
        } else {
            const patient = mainzelhandler.createPatient(idat, patientForm["mdat-input"].value);
            patients.set(nextKey++, patient);
        }

        document.getElementById("idat-error").innerHTML = "";

        patientForm["key-input"].value = "";
        patientForm["firstname-input"].value = "";
        patientForm["lastname-input"].value = "";
        patientForm["birthday-input"].value = "";
        patientForm["mdat-input"].value = "";

        updateList();
    } catch (error) {
        document.getElementById("idat-error").innerHTML = error.message;
        console.error(error);
    }
}

async function updatePseudonyms() {
    try {
        await mainzelhandler.sendPatients(patients);
    } catch (error) {
        document.getElementById("server-error").innerHTML = error.message;
        console.error(error);
    }

    updateList();
}

function updateList() {

    const patientList = document.getElementById("patient-list");

    patientList.innerHTML = "";

    for (const [key, patient] of patients.entries()) {

        const listElement = document.createElement('li');

        switch (patient.status) {
            case PatientStatus.CREATED:
                listElement.appendChild(document.createTextNode("Schlüssel: " + key + ", Status: Ausstehend, Patient: " + JSON.stringify(patient.idat) + ", Daten: " + patient.mdat + ", sureness: " + patient.sureness));
                addPseudonymizeButton(key, listElement);
                addEditButton(key, listElement);
                addSureButton(key, listElement);
                addDeleteButton(key, listElement);
                break;

            case PatientStatus.PSEUDONYMIZED:
                listElement.appendChild(document.createTextNode("Schlüssel: " + key + ", Status: Pseudonymisiert, Patient: " + JSON.stringify(patient.idat) + ", Daten: " + patient.mdat + ", sureness: " + patient.sureness + ", Pseudonym: " + patient.pseudonym));
                addDeleteButton(key, listElement);
                break;

            case PatientStatus.IDAT_CONFLICT:
            case PatientStatus.TOKEN_INVALID:
            case PatientStatus.IDAT_INVALID:
                listElement.appendChild(document.createTextNode("Schlüssel: " + key + ", Status: Konflikt, Patient: " + JSON.stringify(patient.idat) + ", Daten: " + patient.mdat + ", sureness: " + patient.sureness + ", Konflikt: " + patient.status));
                addRetryButton(key, listElement);
                addEditButton(key, listElement);
                addSureButton(key, listElement);
                addDeleteButton(key, listElement);
                break;
            case PatientStatus.PROCESSED:
                listElement.appendChild(document.createTextNode("Schlüssel: " + key + ", Status: Gespeichert, Patient: " + JSON.stringify(patient.idat) + ", Pseudonym: " + patient.pseudonym + ", Daten: " + patient.mdat));
                addDeleteButton(key, listElement);
                break;
            case PatientStatus.NOT_PROCESSED:
                listElement.appendChild(document.createTextNode("Schlüssel: " + key + ", Status: Nicht Gespeichert, Patient: " + JSON.stringify(patient.idat) + ", Pseudonym: " + patient.pseudonym + ", Daten: " + patient.mdat));
                addDeleteButton(key, listElement);
                break;
        }

        patientList.appendChild(listElement);
    }

    if (patientList.innerHTML === "") {
        patientList.innerHTML = "Keine Patienten";
    }
}

function addDeleteButton(key, listElement) {
    const deleteButton = document.createElement("button");
    deleteButton.innerText = "Löschen";

    deleteButton.addEventListener("click", () => {
        patients.delete(key);
        updateList();
    });
    listElement.appendChild(deleteButton);
}

function addEditButton(key, listElement) {
    const editButton = document.createElement("button");
    editButton.innerText = "Bearbeiten";

    const patient = patients.get(key);

    editButton.addEventListener("click", () => {
        let month = (patient.idat.geburtsmonat + 1).toString();
        let day = patient.idat.geburtstag.toString();

        if (month.length === 1) {
            month = "0" + month;
        }

        if (day.length === 1) {
            day = "0" + day;
        }

        const dateString = patient.idat.geburtsjahr + "-" + month + "-" + day;

        const patientForm = document.getElementById("patient-form");
        patientForm["key-input"].value = key;
        patientForm["firstname-input"].value = patient.idat.vorname;
        patientForm["lastname-input"].value = patient.idat.nachname;
        patientForm["birthday-input"].value = dateString;
    });

    listElement.appendChild(editButton);
}

function addSureButton(key, listElement) {
    const sureButton = document.createElement("button");
    sureButton.innerText = "Wechsel sureness";

    sureButton.addEventListener("click", () => {
        const patient = patients.get(key);
        patient.sureness = !patient.sureness;
        updateList();
    });

    listElement.appendChild(sureButton);
}

function addRetryButton(key, listElement) {
    const retryButton = document.createElement("button");
    retryButton.innerText = "Wiederholen";

    retryButton.addEventListener("click", async () => {
        document.getElementById("server-error").innerHTML = "";

        try {
            await mainzelhandler.sendPatients(patients, [key]);
        } catch (error) {
            document.getElementById("server-error").innerHTML = error.message;
        }

        updateList();
    });

    listElement.appendChild(retryButton);
}

function addPseudonymizeButton(key, listElement) {
    const pseuButton = document.createElement("button");
    pseuButton.innerText = "Speichern";

    pseuButton.addEventListener("click", async () => {
        document.getElementById("server-error").innerHTML = "";

        try {
            await mainzelhandler.sendPatients(patients, [key]);
        } catch (error) {
            document.getElementById("server-error").innerHTML = error.message;
        }

        updateList();
    });

    listElement.appendChild(pseuButton);
}
