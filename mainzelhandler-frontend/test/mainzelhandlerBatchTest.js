'use strict';

import { PatientStatus, Mainzelhandler } from "./mainzelhandler.js";
import config from "./mainzelhandlerConfig.js";

QUnit.config.autostart = false;

var mainzelhandler;

window.onload = function () {
    config.serverURL = contextPath + requestPath;
    mainzelhandler = new Mainzelhandler(config);
    QUnit.start();
}

QUnit.module('batch-test', () => {
    // TODO: Tests failing because patients have the same pseudonym; i = 11/ 111, 22/ 222, ...

    let patients = new Map();
    const amount = 100;

    QUnit.test('batch pseudonymization', async assert => {
        assert.expect(amount * 6 + 2);

        // send
        for (let i = 0; i < amount; ++i) {
            const patient = mainzelhandler.createPatient({ vorname: "BatchTestPatient", nachname: i.toString(), geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2000 }, JSON.stringify({ height: i }));
            patient.sureness = true;
            patients.set(i, patient);
        }

        await mainzelhandler.sendPatients(patients);

        for (const [key, patient] of patients.entries()) {
            assert.strictEqual(patient.status, PatientStatus.PROCESSED, "Compare status of patient " + key);
        }

        // request
        patients = new Map();

        for (let i = 0; i < amount; ++i) {
            const patient = mainzelhandler.createPatient({ vorname: "BatchTestPatient", nachname: i.toString(), geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2000 });
            patients.set(i, patient);
        }

        await mainzelhandler.requestPatients(patients);

        for (const [key, patient] of patients.entries()) {
            assert.strictEqual(patient.status, PatientStatus.FOUND, "Compare status of patient " + key);
            assert.deepEqual(JSON.parse(patient.mdat), { height: key }, "Compare MDAT of patient " + key);
        }

        // depseudonymize
        const pseudonyms = [];

        for (const patient of patients.values())
            pseudonyms.push(patient.pseudonym);

        const { depseudonymized, invalid } = await mainzelhandler.depseudonymize(pseudonyms, ["vorname", "nachname", "geburtstag", "geburtsmonat", "geburtsjahr"]);

        assert.strictEqual(invalid.length, 0, "Check amount of invalid pseudonyms");
        assert.strictEqual(depseudonymized.size, amount, "Check amount of depseudonymized");

        for (const [key, patient] of patients.entries()) {
            const pseudonym = patient.pseudonym;

            assert.true(depseudonymized.has(pseudonym), "Check pseudonym of patient " + key);
            const idat = depseudonymized.get(pseudonym).idat;
            const tentative = depseudonymized.get(pseudonym).tentative;
            assert.deepEqual(idat, patient.idat, "Check IDAT of patient " + key);
            assert.strictEqual(tentative, true, "Check tentative of patient " + key);
        }
    });
});
