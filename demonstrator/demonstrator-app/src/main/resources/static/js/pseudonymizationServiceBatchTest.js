'use strict';

QUnit.config.autostart = false;

var pseudonymizationService;

window.onload = function () {
    pseudonymizationService = new PseudonymizationService(contextPath);
    QUnit.start();
}

QUnit.module('batch pseudonymization', () => {

    QUnit.test('100 Patients', async assert => {
        const amount = 100;

        assert.expect(amount * 3);

        // pseudonymization
        let patients = new Map();

        for (let i = 0; i < amount; ++i) {
            const patient = pseudonymizationService.createPatient("BatchTestPatient", i.toString(), "01-01-2000", { height: i });
            patient.sureness = true;
            patients.set(i, patient);
        }

        await pseudonymizationService.sendPatients(patients);

        for (const patient of patients.values()) {
            assert.strictEqual(patient.status, PatientStatus.SAVED);
        }

        // depseudonymization
        patients = new Map();

        for (let i = 0; i < amount; ++i) {
            const patient = pseudonymizationService.createPatient("BatchTestPatient", i.toString(), "01-01-2000");
            //patient.sureness = true;
            patients.set(i, patient);
        }

        await pseudonymizationService.requestPatients(patients);

        for (const [key, patient] of patients.entries()) {
            assert.strictEqual(patient.status, PatientStatus.FOUND, "Compare status of patient " + key);
            assert.deepEqual(patient.mdat, { height: key });
        }
    });
});
