'use strict';

QUnit.config.autostart = false;

var pseudonymizationService;

window.onload = function () {
    pseudonymizationService = new PseudonymizationService(contextPath);
    QUnit.start();
}

QUnit.module('pseudonymization', () => {

    QUnit.test('sendPatients', async assert => {
        assert.expect(4);

        const patients = new Map();

        const patient0 = pseudonymizationService.createPatient("Integration", "Test", "01-01-2000");
        patients.set(0, patient0);

        const patient1 = pseudonymizationService.createPatient("Integration", "Test", "01-01-2000");
        patients.set(1, patient1);

        await pseudonymizationService.sendPatients(patients, [0]);

        // TODO: Update PatientStatus after rework
        assert.strictEqual(patient0.status, PatientStatus.SAVED, 'Compare status');
        assert.strictEqual(patient0.pseudonym, "H0N587RL", 'Compare pseudonym');

        assert.strictEqual(patient1.status, PatientStatus.CREATED, 'Compare status');
        assert.strictEqual(patient1.pseudonym, null, 'Compare pseudonym');
    });

    QUnit.test('conflict handling', async assert => {
        assert.expect(9);

        const patients = new Map();

        // should be successful
        const patient0 = pseudonymizationService.createPatient("Integration", "Test", "01-01-2000");
        patients.set(0, patient0);

        // should create a conflict
        const patient1 = pseudonymizationService.createPatient("Integration", "Test", "01-02-2020");
        patients.set(1, patient1);

        await pseudonymizationService.sendPatients(patients);

        // TODO: Update PatientStatus after rework
        assert.strictEqual(patient0.status, PatientStatus.SAVED, 'Compare status');
        assert.strictEqual(patient0.pseudonym, "H0N587RL", 'Compare pseudonym');
        assert.strictEqual(patient0.tokenURL, null, 'Compare tokenURL');

        assert.strictEqual(patient1.status, PatientStatus.IDAT_CONFLICT, 'Compare status');
        assert.strictEqual(patient1.pseudonym, null, 'Compare pseudonym');
        assert.true((typeof patient1.tokenURL === 'string'), 'Check tokenURL');

        // should resolve the conflict
        pseudonymizationService.updateIDAT(patient1, "Integration", "Test", "01-01-2000");

        await pseudonymizationService.sendPatients(patients);

        // TODO: Update PatientStatus after rework
        assert.strictEqual(patient1.status, PatientStatus.SAVED, 'Compare status');
        assert.strictEqual(patient1.pseudonym, "H0N587RL", 'Compare pseudonym');
        assert.strictEqual(patient1.tokenURL, null, 'Compare tokenURL');
    });

    QUnit.test('requestPatients', async assert => {
        assert.expect(4);

        const patients = new Map();
        let mdat = {testProperty: 0};

        const patient0 = pseudonymizationService.createPatient("Integration", "Test", "01-01-2000", mdat);
        patients.set(0, patient0);

        await pseudonymizationService.sendPatients(patients, [0]);

        const patient1 = pseudonymizationService.createPatient("Integration", "Test", "01-01-2000");
        patients.set(1, patient1);

        await pseudonymizationService.requestPatients(patients, [1]);

        assert.strictEqual(patient1.status, PatientStatus.FOUND, 'Compare status');
        assert.deepEqual(patient1.mdat, mdat, 'Compare MDAT');

        mdat = {testProperty: 1};
        pseudonymizationService.updateMDAT(patient0, mdat);

        await pseudonymizationService.sendPatients(patients, [0]);
        await pseudonymizationService.requestPatients(patients, [1], true);

        assert.strictEqual(patient1.status, PatientStatus.FOUND, 'Compare status');
        assert.deepEqual(patient1.mdat, mdat, 'Compare MDAT');
    });
});

QUnit.module('depseudonymization', hooks => {

    const patients = new Map();
    const firstname = "Integration";
    const lastname = "Test";
    const birthday = new Date("01-01-2000");

    hooks.before(async () => {
        // make sure the patient exists
        const patient0 = pseudonymizationService.createPatient(firstname, lastname, birthday);
        patients.set(0, patient0);
        await pseudonymizationService.sendPatients(patients);
    });

    QUnit.test('successful depseudonymization', async assert => {
        assert.expect(6);

        const pseudonym = 'H0N587RL';
        const { depseudonymized, invalid } = await pseudonymizationService.depseudonymize(pseudonym);

        assert.strictEqual(depseudonymized.size, 1, "Check amount of depseudonymized");
        assert.true(depseudonymized.has(pseudonym), "Check if pseudonym got depseudonymized");
        assert.strictEqual(invalid.length, 0, "Check amount of invalid pseudonyms")

        const idat = depseudonymized.get(pseudonym);

        assert.strictEqual(idat.firstname, firstname, "Compare firstname");
        assert.strictEqual(idat.lastname, lastname, "Compare lastname");
        assert.strictEqual(idat.birthday.getTime(), birthday.getTime(), "Compare birthday");
    });

    QUnit.test('invalid depseudonymization', async assert => {
        assert.expect(3);

        const pseudonym = '';
        const { depseudonymized, invalid } = await pseudonymizationService.depseudonymize(pseudonym);

        assert.strictEqual(depseudonymized.size, 0, "Check amount of depseudonymized");
        assert.strictEqual(invalid.length, 1, "Check amount of invalid pseudonyms");
        assert.true(invalid.includes(pseudonym), "Check if pseudonym is invalid");
    });

    QUnit.test('mixed depseudonymization', async assert => {
        assert.expect(9);

        // TODO add another valid pseudonym
        const pseudonym0 = '';
        const pseudonym1 = 'H0N587RL';
        const pseudonym2 = 'Hello!';
        const pseudonym3 = 'H0N587RL';
        const pseudonym4 = 'Hello!';

        const pseudonyms = [pseudonym0, pseudonym1, pseudonym2, pseudonym3, pseudonym4];

        const { depseudonymized, invalid } = await pseudonymizationService.depseudonymize(pseudonyms);

        assert.strictEqual(depseudonymized.size, 1, "Check amount of depseudonymized");
        assert.true(depseudonymized.has(pseudonym1), "Check if pseudonym got depseudonymized");

        const idat = depseudonymized.get(pseudonym1);

        assert.strictEqual(idat.firstname, firstname, "Compare firstname");
        assert.strictEqual(idat.lastname, lastname, "Compare lastname");
        assert.strictEqual(idat.birthday.getTime(), birthday.getTime(), "Compare birthday");


        assert.strictEqual(invalid.length, 2, "Check amount of invalid pseudonyms");
        assert.true(invalid.includes(pseudonym0), "Check if pseudonym is invalid: " + pseudonym0);
        assert.true(invalid.includes(pseudonym2), "Check if pseudonym is invalid: " + pseudonym2);
        assert.true(invalid.includes(pseudonym4), "Check if pseudonym is invalid: " + pseudonym4);
    });
});
