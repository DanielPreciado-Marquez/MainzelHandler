'use strict'

import { PseudonymHandler } from "./pseudonymHandler.js";

var pseudonyms = [];
var pseudonymHandler;

window.onload = function () {
    pseudonymHandler = new PseudonymHandler(contextPath + requestPath);

    updateList();

    document.getElementById("add-pseudonym-button").addEventListener("click", addPseudonym);
    document.getElementById("depseudonymize-button").addEventListener("click", updatePseudonyms);
}

function addPseudonym() {
    const pseudonymForm = document.getElementById("pseudonym-form");
    const pseudonym = pseudonymForm["pseudonym-input"].value;

    pseudonyms.push(pseudonym);
    updateList();
}

async function updatePseudonyms() {
    document.getElementById("server-error").innerHTML = "";

    try {
        const { depseudonymized, invalid } = await pseudonymHandler.depseudonymize(pseudonyms);
        updateList(depseudonymized, invalid);
    } catch (error) {
        document.getElementById("server-error").innerHTML = error.message;
    }
}

function updateList(depseudonymized, invalid) {
    depseudonymized = depseudonymized ?? new Map();
    invalid = invalid ?? [];

    const pseudonymList = document.getElementById("pseudonym-list");

    pseudonymList.innerHTML = "";

    for (const [key, pseudonym] of pseudonyms.entries()) {
        const listElement = document.createElement('li');

        if (depseudonymized.has(pseudonym)) {
            const result = depseudonymized.get(pseudonym);
            listElement.appendChild(document.createTextNode("key: " + key + ", Pseudonym: " + pseudonym + ", IDAT: " + JSON.stringify(result.idat) + ", tentative: " + result.tentative));
        } else if (invalid.includes(pseudonym)) {
            listElement.appendChild(document.createTextNode("key: " + key + ", Pseudonym: " + pseudonym + ", Nicht gefunden"));
        } else {
            listElement.appendChild(document.createTextNode("key: " + key + ", Pseudonym: " + pseudonym + ", Nicht angefragt"));
        }

        addDeleteButton(key, listElement);
        pseudonymList.appendChild(listElement);
    }

    if (pseudonymList.innerHTML === "") {
        pseudonymList.innerHTML = "Keine Pseudonyme";
    }
}

function addDeleteButton(key, listElement) {
    const deleteButton = document.createElement("button");
    deleteButton.innerText = "Löschen";

    deleteButton.addEventListener("click", () => {
        pseudonyms.splice(pseudonyms.indexOf(key), 1);
        updateList();
    });
    listElement.appendChild(deleteButton);
}
