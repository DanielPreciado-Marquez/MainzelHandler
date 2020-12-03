'use strict'

var pseudonyms = [];
var pseudonymizationService;

window.onload = function () {
    pseudonymizationService = new PseudonymizationService(contextPath + requestPath);

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
        const { depseudonymized, invalid } = await pseudonymizationService.depseudonymize(pseudonyms);
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
            listElement.appendChild(document.createTextNode("key: " + key + ", pseudonym: " + pseudonym + ", IDAT: " + JSON.stringify(depseudonymized.get(pseudonym))));
        } else if (invalid.includes(pseudonym)) {
            listElement.appendChild(document.createTextNode("key: " + key + ", pseudonym: " + pseudonym + ", Nicht gefunden"));
        } else {
            listElement.appendChild(document.createTextNode("key: " + key + ", pseudonym: " + pseudonym + ", Nicht angefragt"));
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