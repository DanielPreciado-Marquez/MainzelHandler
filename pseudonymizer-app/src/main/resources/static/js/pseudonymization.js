'use strict';

/**
 * @type {Map<patientId, Patient>}
 */
var patients = new Map();
var nextKey = 0;

window.onload = function () {
    updateList();

    document.getElementById("add-patient").addEventListener("click", createPatient);
    document.getElementById("pseudonym-button").addEventListener("click", updatePseudonyms);
}

function createPatient() {
    const patientForm = document.getElementById("patient-form");

    const idat = PseudonymizationService.createIDAT(patientForm["firstname-input"].value, patientForm["lastname-input"].value, patientForm["birthday-input"].value);

    if (idat.valid) {

        const key = parseInt(patientForm["key-input"].value);

        if (patients.has(key)) {
            patients.get(key).idat = idat.idat;
        } else {
            const patient = PseudonymizationService.createPatient(idat.idat, { height: 180 });
            patients.set(nextKey++, patient);
        }

        patientForm["key-input"].value = "";
        patientForm["firstname-input"].value = "";
        patientForm["lastname-input"].value = "";
        patientForm["birthday-input"].value = "";
        updateList();
    }

    const statusMessage = idat.statusMessage;
    document.getElementById("idat-error").innerHTML = statusMessage;
}

async function updatePseudonyms() {
    try {
        await PseudonymizationService.storePatients(patients);
    } catch (error) {
        document.getElementById("server-error").innerHTML = error;
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
                listElement.appendChild(document.createTextNode("key: " + key + ", status: Ausstehend,  patient: " + JSON.stringify(patient.idat) + ", sureness: " + patient.sureness));
                addPseudonymizeButton(key, listElement);
                addEditButton(key, listElement);
                addSureButton(key, listElement);
                addDeleteButton(key, listElement);
                break;

            case PatientStatus.PSEUDONYMIZED:
                listElement.appendChild(document.createTextNode("key: " + key + ", status: Ok,  patient: " + JSON.stringify(patient.idat) + ", sureness: " + patient.sureness + ", pseudonym: " + patient.pseudonym));
                addDeleteButton(key, listElement);
                break;

            case PatientStatus.CONFLICT:
                listElement.appendChild(document.createTextNode("key: " + key + ", status: Konflikt,  patient: " + JSON.stringify(patient.idat) + ", sureness: " + patient.sureness + ", conflict: " + patient.conflict.statusMessage));
                addRetryButton(key, listElement);
                addEditButton(key, listElement);
                addSureButton(key, listElement);
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
    deleteButton.innerText = "delete";

    deleteButton.addEventListener("click", () => {
        patients.delete(key);
        updateList();
    });
    listElement.appendChild(deleteButton);
}

function addEditButton(key, listElement) {
    const editButton = document.createElement("button");
    editButton.innerText = "edit";

    const patient = patients.get(key);

    editButton.addEventListener("click", () => {
        let month = (patient.idat.birthday.getMonth() + 1).toString();
        let day = patient.idat.birthday.getDate().toString();

        if (month.length === 1) {
            month = "0" + month;
        }

        if (day.length === 1) {
            day = "0" + day;
        }

        const dateString = patient.idat.birthday.getFullYear() + "-" + month + "-" + day;

        const patientForm = document.getElementById("patient-form");
        patientForm["key-input"].value = key;
        patientForm["firstname-input"].value = patient.idat.firstname;
        patientForm["lastname-input"].value = patient.idat.lastname;
        patientForm["birthday-input"].value = dateString;
    });

    listElement.appendChild(editButton);
}

function addSureButton(key, listElement) {
    const sureButton = document.createElement("button");
    sureButton.innerText = "change sureness";

    sureButton.addEventListener("click", () => {
        const patient = patients.get(key);
        patient.sureness = !patient.sureness;
        updateList();
    });

    listElement.appendChild(sureButton);
}

function addRetryButton(key, listElement) {
    const retryButton = document.createElement("button");
    retryButton.innerText = "retry";

    retryButton.addEventListener("click", async () => {
        await PseudonymizationService.storePatients(patients, [key], PatientStatus.CONFLICT);
        updateList();
    });

    listElement.appendChild(retryButton);
}

function addPseudonymizeButton(key, listElement) {
    const pseuButton = document.createElement("button");
    pseuButton.innerText = "Store";

    pseuButton.addEventListener("click", async () => {
        await PseudonymizationService.storePatients(patients, [key]);
        updateList();
    });

    listElement.appendChild(pseuButton);
}
