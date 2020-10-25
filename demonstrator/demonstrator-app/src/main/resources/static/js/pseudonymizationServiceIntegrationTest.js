'use strict';

QUnit.config.autostart = false;

var pseudonymizationService;

window.onload = function () {
    pseudonymizationService = new PseudonymizationService(contextPath);
    QUnit.start();
}

QUnit.module('sendPatients', () => {

    QUnit.test('successful pseudonymization', async assert => {
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

    QUnit.test('Successful depseudonymization', async assert => {
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
        // TODO: Create a function like updateMDAT for this
        patient0.mdat = mdat;
        patient0.status = PatientStatus.PSEUDONYMIZED;

        await pseudonymizationService.sendPatients(patients, [0]);

        // TODO: Search patient1 second time instead of changing the status
        patient1.status = PatientStatus.PSEUDONYMIZED;

        await pseudonymizationService.requestPatients(patients, [1]);

        assert.strictEqual(patient1.status, PatientStatus.FOUND, 'Compare status');
        assert.deepEqual(patient1.mdat, mdat, 'Compare MDAT');
    });
});
