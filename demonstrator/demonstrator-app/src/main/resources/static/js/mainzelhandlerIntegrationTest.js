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

QUnit.module('pseudonymization', () => {

    QUnit.test('sendPatients', async assert => {
        assert.expect(4);

        const patients = new Map();

        const patient0 = mainzelhandler.createPatient(mainzelhandler.createIDAT("Integration", "Test", 20, 10, 2020));
        patients.set(0, patient0);

        const patient1 = mainzelhandler.createPatient(mainzelhandler.createIDAT("Integration", "Test", 20, 10, 2020));
        patients.set(1, patient1);

        await mainzelhandler.sendPatients(patients, [0]);

        assert.strictEqual(patient0.status, PatientStatus.PROCESSED, 'Compare status');
        assert.strictEqual(patient0.pseudonym, "000CU0WP", 'Compare pseudonym');

        assert.strictEqual(patient1.status, PatientStatus.CREATED, 'Compare status');
        assert.strictEqual(patient1.pseudonym, null, 'Compare pseudonym');
    });

    QUnit.test('conflict handling', async assert => {
        assert.expect(9);

        const patients = new Map();

        // should be successful
        const patient0 = mainzelhandler.createPatient({ vorname: "Integration", nachname: "Test", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        patients.set(0, patient0);

        // should create a conflict
        const patient1 = mainzelhandler.createPatient({ vorname: "Integration", nachname: "Test", geburtstag: 21, geburtsmonat: 10, geburtsjahr: 2020 });
        patients.set(1, patient1);

        await mainzelhandler.sendPatients(patients);

        assert.strictEqual(patient0.status, PatientStatus.PROCESSED, 'Compare status of patient0');
        assert.strictEqual(patient0.pseudonym, "000CU0WP", 'Compare pseudonym of patient0');
        assert.strictEqual(patient0.tokenURL, null, 'Compare tokenURL of patient0');

        assert.strictEqual(patient1.status, PatientStatus.IDAT_CONFLICT, 'Compare status of patient1');
        assert.strictEqual(patient1.pseudonym, null, 'Compare pseudonym of patient1');
        assert.true((typeof patient1.tokenURL === 'string'), 'Check tokenURL of patient1');

        // should resolve the conflict
        mainzelhandler.updateIDAT(patient1, { geburtstag: 20 });

        await mainzelhandler.sendPatients(patients);

        assert.strictEqual(patient1.status, PatientStatus.PROCESSED, 'Compare status');
        assert.strictEqual(patient1.pseudonym, "000CU0WP", 'Compare pseudonym');
        assert.strictEqual(patient1.tokenURL, null, 'Compare tokenURL');
    });

    QUnit.test('requestPatients', async assert => {
        assert.expect(4);

        const patients = new Map();
        let mdat = { testProperty: 0 };

        const patient0 = mainzelhandler.createPatient({ vorname: "Integration", nachname: "Test", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 }, JSON.stringify(mdat));
        patients.set(0, patient0);

        await mainzelhandler.sendPatients(patients, [0]);

        const patient1 = mainzelhandler.createPatient({ vorname: "Integration", nachname: "Test", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        patients.set(1, patient1);

        await mainzelhandler.requestPatients(patients, [1]);

        assert.strictEqual(patient1.status, PatientStatus.FOUND, 'Compare status');
        assert.deepEqual(JSON.parse(patient1.mdat), mdat, 'Compare MDAT');

        mdat = { testProperty: 1 };
        mainzelhandler.updateMDAT(patient0, JSON.stringify(mdat));

        await mainzelhandler.sendPatients(patients, [0]);
        await mainzelhandler.requestPatients(patients, [1], true);

        assert.strictEqual(patient1.status, PatientStatus.FOUND, 'Compare status');
        assert.deepEqual(JSON.parse(patient1.mdat), mdat, 'Compare MDAT');
    });
});

QUnit.module('depseudonymization', hooks => {

    const patients = new Map();
    const vorname = "Integration";
    const nachname = "Test";
    const geburtstag = 20;
    const geburtsmonat = 10;
    const geburtsjahr = 2020;
    const idat0 = { vorname, nachname, geburtstag, geburtsmonat, geburtsjahr };

    hooks.before(async () => {
        // make sure the patient exists
        const patient0 = mainzelhandler.createPatient(idat0);
        patients.set(0, patient0);
        await mainzelhandler.sendPatients(patients);
    });

    QUnit.test('successful depseudonymization', async assert => {
        assert.expect(9);

        const pseudonym = '000CU0WP';
        const { depseudonymized, invalid } = await mainzelhandler.depseudonymize(pseudonym);

        assert.strictEqual(depseudonymized.size, 1, "Check amount of depseudonymized");
        assert.true(depseudonymized.has(pseudonym), "Check if pseudonym got depseudonymized");
        assert.strictEqual(invalid.length, 0, "Check amount of invalid pseudonyms")

        const idat = depseudonymized.get(pseudonym).idat;
        const tentative = depseudonymized.get(pseudonym).tentative;

        assert.strictEqual(idat.vorname, vorname, "Compare firstname");
        assert.strictEqual(idat.nachname, nachname, "Compare lastname");
        assert.strictEqual(idat.geburtstag, geburtstag, 'Compare birthday');
        assert.strictEqual(idat.geburtsmonat, geburtsmonat, 'Compare birth month');
        assert.strictEqual(idat.geburtsjahr, geburtsjahr, 'Compare birth year');
        assert.strictEqual(tentative, false, "Compare tentative");
    });

    QUnit.test('invalid depseudonymization', async assert => {
        assert.expect(3);

        const pseudonym = '';
        const { depseudonymized, invalid } = await mainzelhandler.depseudonymize(pseudonym);

        assert.strictEqual(depseudonymized.size, 0, "Check amount of depseudonymized");
        assert.strictEqual(invalid.length, 1, "Check amount of invalid pseudonyms");
        assert.true(invalid.includes(pseudonym), "Check if pseudonym is invalid");
    });

    QUnit.test('mixed depseudonymization', async assert => {
        assert.expect(13);

        const pseudonym0 = '';
        const pseudonym1 = '000CU0WP';
        const pseudonym2 = 'Hello!';
        const pseudonym3 = '000CU0WP';
        const pseudonym4 = 'Hello!';
        const pseudonym5 = '0007W0W9';

        const pseudonyms = [pseudonym0, pseudonym1, pseudonym2, pseudonym3, pseudonym4, pseudonym5];

        const { depseudonymized, invalid } = await mainzelhandler.depseudonymize(pseudonyms);

        assert.strictEqual(depseudonymized.size, 2, "Check amount of depseudonymized");
        assert.true(depseudonymized.has(pseudonym1), "Check if H0N587RL got depseudonymized");
        assert.true(depseudonymized.has(pseudonym5), "Check if 0007W0W9 got depseudonymized");

        const idat = depseudonymized.get(pseudonym1).idat;
        const tentative = depseudonymized.get(pseudonym1).tentative;

        assert.strictEqual(idat.vorname, vorname, "Compare firstname");
        assert.strictEqual(idat.nachname, nachname, "Compare lastname");
        assert.strictEqual(idat.geburtstag, geburtstag, 'Compare birthday');
        assert.strictEqual(idat.geburtsmonat, geburtsmonat, 'Compare birth month');
        assert.strictEqual(idat.geburtsjahr, geburtsjahr, 'Compare birth year');
        assert.strictEqual(tentative, false, "Compare tentative");

        assert.strictEqual(invalid.length, 2, "Check amount of invalid pseudonyms");
        assert.true(invalid.includes(pseudonym0), "Check if pseudonym is invalid: " + pseudonym0);
        assert.true(invalid.includes(pseudonym2), "Check if pseudonym is invalid: " + pseudonym2);
        assert.true(invalid.includes(pseudonym4), "Check if pseudonym is invalid: " + pseudonym4);
    });
});
