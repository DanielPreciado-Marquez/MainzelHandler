'use strict';

QUnit.config.autostart = false;

var pseudonymizationService;

window.onload = function () {
    pseudonymizationService = new PseudonymizationService(contextPath);
    QUnit.start();
}

QUnit.module('createIDAT', () => {

    QUnit.test('Create IDAT with a string for the Date', assert => {
        assert.expect(3);

        const idat = pseudonymizationService.createIDAT("a", "s", "08-10-2020");

        assert.strictEqual(idat.birthday.getTime(), new Date("08-10-2020").getTime(), 'Compare birthday');
        assert.strictEqual(idat.firstname, "a", 'Compare firstname');
        assert.strictEqual(idat.lastname, "s", 'Compare lastname');
    });

    QUnit.test('Create IDAT with a number for the Date', assert => {
        assert.expect(3);

        const idat = pseudonymizationService.createIDAT(" q", "w ", 12);

        assert.strictEqual(idat.birthday.getTime(), new Date(12).getTime(), 'Compare birthday');
        assert.strictEqual(idat.firstname, "q", 'Compare firstname');
        assert.strictEqual(idat.lastname, "w", 'Compare lastname');
    });

    QUnit.test('Create IDAT with a Date for the Date', assert => {
        assert.expect(3);

        const idat = pseudonymizationService.createIDAT("e", " r ", new Date("10-10-2020"));

        assert.strictEqual(idat.birthday.getTime(), new Date("10-10-2020").getTime(), 'Compare birthday');
        assert.strictEqual(idat.firstname, "e", 'Compare firstname');
        assert.strictEqual(idat.lastname, "r", 'Compare lastname');
    });

    QUnit.test('Invalid firstname', assert => {
        assert.expect(4);

        assert.throws(
            () => {
                pseudonymizationService.createIDAT();
            },
            /Invalid firstname!/,
            'Firstname undefined'
        );

        assert.throws(
            () => {
                pseudonymizationService.createIDAT(null, null, null);
            },
            /Invalid firstname!/,
            'Firstname null'
        );

        assert.throws(
            () => {
                pseudonymizationService.createIDAT("", null, null);
            },
            /Invalid firstname!/,
            'Firstname empty'
        );

        assert.throws(
            () => {
                pseudonymizationService.createIDAT(0, null, null);
            },
            /Invalid firstname!/,
            'Firstname wrong type'
        );
    });

    QUnit.test('Invalid lastname!', assert => {
        assert.expect(4);

        assert.throws(
            () => {
                pseudonymizationService.createIDAT("a");
            },
            /Invalid lastname!/,
            'Lastname undefined'
        );

        assert.throws(
            () => {
                pseudonymizationService.createIDAT("a", null, null);
            },
            /Invalid lastname!/,
            'Lastname null'
        );

        assert.throws(
            () => {
                pseudonymizationService.createIDAT("a", "", null);
            },
            /Invalid lastname!/,
            'Lastname empty'
        );

        assert.throws(
            () => {
                pseudonymizationService.createIDAT("a", 1, null);
            },
            /Invalid lastname!/,
            'Lastname wrong type'
        );
    });

    QUnit.test('Invalid birthday!', assert => {
        assert.expect(5);

        assert.throws(
            () => {
                pseudonymizationService.createIDAT("a", "b");
            },
            /Invalid birthday!/,
            'birthday undefined'
        );

        assert.throws(
            () => {
                pseudonymizationService.createIDAT("a", "b", null);
            },
            /Invalid birthday!/,
            'birthday null'
        );

        assert.throws(
            () => {
                pseudonymizationService.createIDAT("a", "b", "");
            },
            /Invalid birthday!/,
            'birthday empty'
        );

        assert.throws(
            () => {
                pseudonymizationService.createIDAT("a", "b", true);
            },
            /Invalid birthday!/,
            'birthday wrong type'
        );

        assert.throws(
            () => {
                const date = new Date();
                date.setDate(date.getDate() + 1);

                pseudonymizationService.createIDAT("a", "b", date);
            },
            /Invalid birthday!/,
            'birthday future date'
        );
    });
});


QUnit.module('createPatient', () => {

    QUnit.test('Create regular with MDAT undefined', assert => {
        assert.expect(1);

        const patient = pseudonymizationService.createPatient("a", "s", "08-10-2020");
        assert.deepEqual(patient.mdat, {}, 'Compare MDAT');
    });

    QUnit.test('Create regular with MDAT null', assert => {
        assert.expect(1);

        const patient = pseudonymizationService.createPatient("a", "s", "08-10-2020", null);
        assert.deepEqual(patient.mdat, {}, 'Compare MDAT');
    });

    QUnit.test('Create regular with MDAT', assert => {
        assert.expect(1);

        const patient = pseudonymizationService.createPatient("a", "s", "08-10-2020", { height: 180 });
        assert.deepEqual(patient.mdat, { height: 180 }, 'Compare MDAT');
    });

    QUnit.test('Invalid MDAT', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                pseudonymizationService.createPatient("a", "s", "08-10-2020", "");
            },
            /Invalid MDAT!/,
            'MDAT wrong type (string)'
        );
    });

    QUnit.test('Invalid MDAT', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                pseudonymizationService.createPatient("a", "s", "08-10-2020", [1, 2, 3]);
            },
            /Invalid MDAT!/,
            'MDAT wrong type (Array)'
        );
    });
});

QUnit.module('updateIdat', () => {

    QUnit.test('Update CREATED', assert => {
        assert.expect(3);

        const patient = pseudonymizationService.createPatient("a", "s", "08-10-2020");
        pseudonymizationService.updateIDAT(patient, "q", "w", "09-10-2020");

        assert.strictEqual(patient.idat.birthday.getTime(), new Date("09-10-2020").getTime(), 'Compare birthday');
        assert.strictEqual(patient.idat.firstname, "q", 'Compare firstname');
        assert.strictEqual(patient.idat.lastname, "w", 'Compare lastname');
    });

    QUnit.test('Update conflict', assert => {
        assert.expect(5);

        const patient = pseudonymizationService.createPatient("a", "s", "08-10-2020");
        patient.status = PatientStatus.IDAT_CONFLICT;
        patient.tokenURL = "http://tokenURL";

        pseudonymizationService.updateIDAT(patient, "q", "w", "09-10-2020");

        assert.strictEqual(patient.idat.birthday.getTime(), new Date("09-10-2020").getTime(), 'Compare birthday');
        assert.strictEqual(patient.idat.firstname, "q", 'Compare firstname');
        assert.strictEqual(patient.idat.lastname, "w", 'Compare lastname');
        assert.strictEqual(patient.status, PatientStatus.IDAT_CONFLICT, 'Compare status');
        assert.strictEqual(patient.tokenURL, "http://tokenURL", 'Compare tokenURL');
    });

    QUnit.test('Update PSEUDONYMIZED different firstname', assert => {
        assert.expect(5);

        const patient = pseudonymizationService.createPatient("a", "s", "08-10-2020");
        patient.status = PatientStatus.PSEUDONYMIZED;
        patient.pseudonym = "pseudonym";

        pseudonymizationService.updateIDAT(patient, "q", "s", "08-10-2020");

        assert.strictEqual(patient.idat.birthday.getTime(), new Date("08-10-2020").getTime(), 'Compare birthday');
        assert.strictEqual(patient.idat.firstname, "q", 'Compare firstname');
        assert.strictEqual(patient.idat.lastname, "s", 'Compare lastname');
        assert.strictEqual(patient.status, PatientStatus.CREATED, 'Compare status');
        assert.strictEqual(patient.pseudonym, null, 'Compare pseudonym');
    });

    QUnit.test('Update PSEUDONYMIZED different lastname', assert => {
        assert.expect(5);

        const patient = pseudonymizationService.createPatient("a", "s", "08-10-2020");
        patient.status = PatientStatus.PSEUDONYMIZED;
        patient.pseudonym = "pseudonym";

        pseudonymizationService.updateIDAT(patient, "a", "w", "08-10-2020");

        assert.strictEqual(patient.idat.birthday.getTime(), new Date("08-10-2020").getTime(), 'Compare birthday');
        assert.strictEqual(patient.idat.firstname, "a", 'Compare firstname');
        assert.strictEqual(patient.idat.lastname, "w", 'Compare lastname');
        assert.strictEqual(patient.status, PatientStatus.CREATED, 'Compare status');
        assert.strictEqual(patient.pseudonym, null, 'Compare pseudonym');
    });

    QUnit.test('Update PSEUDONYMIZED different birthday', assert => {
        assert.expect(5);

        const patient = pseudonymizationService.createPatient("a", "s", "08-10-2020");
        patient.status = PatientStatus.PSEUDONYMIZED;
        patient.pseudonym = "pseudonym";

        pseudonymizationService.updateIDAT(patient, "a", "s", "09-10-2020");

        assert.strictEqual(patient.idat.birthday.getTime(), new Date("09-10-2020").getTime(), 'Compare birthday');
        assert.strictEqual(patient.idat.firstname, "a", 'Compare firstname');
        assert.strictEqual(patient.idat.lastname, "s", 'Compare lastname');
        assert.strictEqual(patient.status, PatientStatus.CREATED, 'Compare status');
        assert.strictEqual(patient.pseudonym, null, 'Compare pseudonym');
    });

    QUnit.test('Update PSEUDONYMIZED same data', assert => {
        assert.expect(5);

        const patient = pseudonymizationService.createPatient("a", "s", "08-10-2020");
        patient.status = PatientStatus.PSEUDONYMIZED;
        patient.pseudonym = "pseudonym";

        pseudonymizationService.updateIDAT(patient, "a", "s", "08-10-2020");

        assert.strictEqual(patient.idat.birthday.getTime(), new Date("08-10-2020").getTime(), 'Compare birthday');
        assert.strictEqual(patient.idat.firstname, "a", 'Compare firstname');
        assert.strictEqual(patient.idat.lastname, "s", 'Compare lastname');
        assert.strictEqual(patient.status, PatientStatus.PSEUDONYMIZED, 'Compare status');
        assert.strictEqual(patient.pseudonym, "pseudonym", 'Compare pseudonym');
    });
});
