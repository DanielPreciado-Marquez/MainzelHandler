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

QUnit.module('createIDAT', () => {

    QUnit.test('Create minimum IDAT', assert => {
        assert.expect(5);

        const idat = mainzelhandler.createIDAT("a", "s", 20, 10, 2020);

        assert.strictEqual(idat.vorname, "a", 'Compare firstname');
        assert.strictEqual(idat.nachname, "s", 'Compare lastname');
        assert.strictEqual(idat.geburtstag, 20, 'Compare birthday');
        assert.strictEqual(idat.geburtsmonat, 10, 'Compare birth month');
        assert.strictEqual(idat.geburtsjahr, 2020, 'Compare birth year');
    });

    QUnit.test('Create IDAT', assert => {
        assert.expect(6);

        const idat = mainzelhandler.createIDAT("q", "w", 3, 1, 1999, "e");

        assert.strictEqual(idat.vorname, "q", 'Compare firstname');
        assert.strictEqual(idat.nachname, "w", 'Compare lastname');
        assert.strictEqual(idat.geburtstag, 3, 'Compare birthday');
        assert.strictEqual(idat.geburtsmonat, 1, 'Compare birth month');
        assert.strictEqual(idat.geburtsjahr, 1999, 'Compare birth year');
        assert.strictEqual(idat.geburtsname, "e", 'Compare birth name');
    });

    QUnit.test('Create maximum IDAT', assert => {
        assert.expect(8);

        const idat = mainzelhandler.createIDAT("t", "z", 11, 1, 1997, "u", "schöner", "Ort");

        assert.strictEqual(idat.vorname, "t", 'Compare firstname');
        assert.strictEqual(idat.nachname, "z", 'Compare lastname');
        assert.strictEqual(idat.geburtstag, 11, 'Compare birthday');
        assert.strictEqual(idat.geburtsmonat, 1, 'Compare birth month');
        assert.strictEqual(idat.geburtsjahr, 1997, 'Compare birth year');
        assert.strictEqual(idat.geburtsname, "u", 'Compare birth name');
        assert.strictEqual(idat.plz, "schöner", 'Compare post code');
        assert.strictEqual(idat.ort, "Ort", 'Compare city');
    });

    QUnit.test('Invalid firstname', assert => {
        assert.expect(3);

        assert.throws(
            () => {
                mainzelhandler.createIDAT();
            },
            /Field with name 'vorname' is not present but required!/,
            'Firstname undefined'
        );

        assert.throws(
            () => {
                mainzelhandler.createIDAT(null, null, null);
            },
            /Field with name 'vorname' is not present but required!/,
            'Firstname null'
        );

        assert.throws(
            () => {
                mainzelhandler.createIDAT(0, null, null);
            },
            /Field with name 'vorname' of the type 'number' must be of the type 'string'!/,
            'Firstname wrong type'
        );
    });

    QUnit.test('Invalid lastname!', assert => {
        assert.expect(3);

        assert.throws(
            () => {
                mainzelhandler.createIDAT("a");
            },
            /Field with name 'nachname' is not present but required!/,
            'Lastname undefined'
        );

        assert.throws(
            () => {
                mainzelhandler.createIDAT("a", null, null);
            },
            /Field with name 'nachname' is not present but required!/,
            'Lastname null'
        );

        assert.throws(
            () => {
                mainzelhandler.createIDAT("a", 1, null);
            },
            /Field with name 'nachname' of the type 'number' must be of the type 'string'!/,
            'Lastname wrong type'
        );
    });

    QUnit.test('Invalid birthday!', assert => {
        assert.expect(5);

        assert.throws(
            () => {
                mainzelhandler.createIDAT("a", "b");
            },
            /Field with name 'geburtstag' is not present but required!/,
            'birthday undefined'
        );

        assert.throws(
            () => {
                mainzelhandler.createIDAT("a", "b", null);
            },
            /Field with name 'geburtstag' is not present but required!/,
            'birthday null'
        );

        assert.throws(
            () => {
                mainzelhandler.createIDAT("a", "b", "");
            },
            /Field with name 'geburtstag' of the type 'string' must be of the type 'number'!/,
            'birthday empty'
        );

        assert.throws(
            () => {
                mainzelhandler.createIDAT("a", "b", true);
            },
            /Field with name 'geburtstag' of the type 'boolean' must be of the type 'number'!/,
            'birthday wrong type'
        );

        assert.throws(
            () => {
                const date = new Date();
                mainzelhandler.createIDAT("a", "b", date);
            },
            /Field with name 'geburtstag' of the type 'object' must be of the type 'number'!/,
            'birthday future date'
        );
    });

    QUnit.test('Invalid birth name!', assert => {
        assert.expect(3);

        assert.throws(
            () => {
                const idat = mainzelhandler.createIDAT("a", "s", 20, 10, 2020, true);
            },
            /Field with name 'geburtsname' of the type 'boolean' must be of the type 'string'!/,
            'birthday wrong type boolean'
        );

        assert.throws(
            () => {
                const idat = mainzelhandler.createIDAT("a", "s", 20, 10, 2020, 3);
            },
            /Field with name 'geburtsname' of the type 'number' must be of the type 'string'!/,
            'birthday wrong type number'
        );

        assert.throws(
            () => {
                const date = new Date();
                const idat = mainzelhandler.createIDAT("a", "s", 20, 10, 2020, date);
            },
            /Field with name 'geburtsname' of the type 'object' must be of the type 'string'!/,
            'birthday wrong type object'
        );
    });
});

QUnit.module('Validate Idat', () => {

    QUnit.test('Create regular IDAT', assert => {
        assert.expect(1);

        const idat = { vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 };
        mainzelhandler.validateIDAT(idat);
        assert.ok(true, "Validation");
    });

    QUnit.test('Missing required field', assert => {
        assert.expect(1);

        const idat = { vorname: "a", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 };

        assert.throws(
            () => {
                mainzelhandler.validateIDAT(idat);
            },
            /Field with name 'nachname' is not present but required!/,
            'MDAT wrong type (object)'
        );
    });

    QUnit.test('Invalid type', assert => {
        assert.expect(1);

        const idat = { vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: "10", geburtsjahr: 2020 };

        assert.throws(
            () => {
                mainzelhandler.validateIDAT(idat);
            },
            /Field with name 'geburtsmonat' of the type 'string' must be of the type 'number'!/,
            'MDAT wrong type (Array)'
        );
    });

    QUnit.test('Invalid field name', assert => {
        assert.expect(1);

        const idat = { vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020, pizza: "delicious" };

        assert.throws(
            () => {
                mainzelhandler.validateIDAT(idat);
            },
            /Field with name 'pizza' is not a valid idat field!/,
            'MDAT wrong type (Array)'
        );
    });
});

QUnit.module('createPatient', () => {

    const idat = { vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 };

    QUnit.test('Create regular with MDAT undefined', assert => {
        assert.expect(1);

        const patient = mainzelhandler.createPatient(idat);
        assert.strictEqual(patient.mdat, "", 'Compare MDAT');
    });

    QUnit.test('Create regular with MDAT null', assert => {
        assert.expect(1);

        const patient = mainzelhandler.createPatient(idat, null);
        assert.deepEqual(patient.mdat, "", 'Compare MDAT');
    });

    QUnit.test('Create regular with MDAT string', assert => {
        assert.expect(1);

        const patient = mainzelhandler.createPatient(idat, "mdat");
        assert.strictEqual(patient.mdat, "mdat", 'Compare MDAT');
    });

    QUnit.test('Create regular with MDAT stringified JS-object', assert => {
        assert.expect(1);

        const patient = mainzelhandler.createPatient(idat, JSON.stringify({ height: 180 }));
        assert.deepEqual(JSON.parse(patient.mdat), { height: 180 }, 'Compare MDAT');
    });

    QUnit.test('Invalid MDAT', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                mainzelhandler.createPatient(idat, { height: 180 });
            },
            /MDAT must be of the type 'string' but is type of 'object'!/,
            'MDAT wrong type (object)'
        );
    });

    QUnit.test('Invalid MDAT', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                mainzelhandler.createPatient(idat, [1, 2, 3]);
            },
            /MDAT must be of the type 'string' but is type of 'object'!/,
            'MDAT wrong type (Array)'
        );
    });
});

QUnit.module('updateIDAT', () => {

    QUnit.test('Update CREATED', assert => {
        assert.expect(5);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        mainzelhandler.updateIDAT(patient, { vorname: "q", nachname: "w", geburtstag: 21, geburtsmonat: 10, geburtsjahr: 2020 });

        assert.strictEqual(patient.idat.vorname, "q", 'Compare firstname');
        assert.strictEqual(patient.idat.nachname, "w", 'Compare lastname');
        assert.strictEqual(patient.idat.geburtstag, 21, 'Compare birthday');
        assert.strictEqual(patient.idat.geburtsmonat, 10, 'Compare birth month');
        assert.strictEqual(patient.idat.geburtsjahr, 2020, 'Compare birth year');
    });

    QUnit.test('Update CREATED remove', assert => {
        assert.expect(6);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020, geburtsname: "e" });
        mainzelhandler.updateIDAT(patient, { vorname: "q", nachname: "w", geburtstag: 21, geburtsname: null });

        assert.strictEqual(patient.idat.vorname, "q", 'Compare firstname');
        assert.strictEqual(patient.idat.nachname, "w", 'Compare lastname');
        assert.strictEqual(patient.idat.geburtstag, 21, 'Compare birthday');
        assert.strictEqual(patient.idat.geburtsmonat, 10, 'Compare birth month');
        assert.strictEqual(patient.idat.geburtsjahr, 2020, 'Compare birth year');
        assert.strictEqual(patient.idat.geburtsname, undefined, 'Compare birth name');
    });

    QUnit.test('Update CREATED add', assert => {
        assert.expect(6);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        mainzelhandler.updateIDAT(patient, { vorname: "q", nachname: "w", geburtstag: 21, geburtsname: "e" });

        assert.strictEqual(patient.idat.vorname, "q", 'Compare firstname');
        assert.strictEqual(patient.idat.nachname, "w", 'Compare lastname');
        assert.strictEqual(patient.idat.geburtstag, 21, 'Compare birthday');
        assert.strictEqual(patient.idat.geburtsmonat, 10, 'Compare birth month');
        assert.strictEqual(patient.idat.geburtsjahr, 2020, 'Compare birth year');
        assert.strictEqual(patient.idat.geburtsname, "e", 'Compare birth name');
    });

    QUnit.test('Add null value', assert => {
        assert.expect(6);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        mainzelhandler.updateIDAT(patient, { geburtsname: null });

        assert.strictEqual(patient.idat.vorname, "a", 'Compare firstname');
        assert.strictEqual(patient.idat.nachname, "s", 'Compare lastname');
        assert.strictEqual(patient.idat.geburtstag, 20, 'Compare birthday');
        assert.strictEqual(patient.idat.geburtsmonat, 10, 'Compare birth month');
        assert.strictEqual(patient.idat.geburtsjahr, 2020, 'Compare birth year');
        assert.strictEqual(patient.idat.geburtsname, undefined, 'Compare birth name');
    });

    QUnit.test('Update conflict', assert => {
        assert.expect(7);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 8, geburtsmonat: 10, geburtsjahr: 2020 });
        patient.status = PatientStatus.IDAT_CONFLICT;
        patient.tokenURL = "http://tokenURL";

        mainzelhandler.updateIDAT(patient, { vorname: "q", nachname: "w", geburtstag: 21 });

        assert.strictEqual(patient.idat.vorname, "q", 'Compare firstname');
        assert.strictEqual(patient.idat.nachname, "w", 'Compare lastname');
        assert.strictEqual(patient.idat.geburtstag, 21, 'Compare birthday');
        assert.strictEqual(patient.idat.geburtsmonat, 10, 'Compare birth month');
        assert.strictEqual(patient.idat.geburtsjahr, 2020, 'Compare birth year');
        assert.strictEqual(patient.status, PatientStatus.IDAT_CONFLICT, 'Compare status');
        assert.strictEqual(patient.tokenURL, "http://tokenURL", 'Compare tokenURL');
    });

    QUnit.test('Update PSEUDONYMIZED different firstname', assert => {
        assert.expect(3);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        patient.status = PatientStatus.PSEUDONYMIZED;
        patient.pseudonym = "pseudonym";

        mainzelhandler.updateIDAT(patient, { vorname: "q" });

        assert.strictEqual(patient.idat.vorname, "q", 'Compare firstname');
        assert.strictEqual(patient.status, PatientStatus.CREATED, 'Compare status');
        assert.strictEqual(patient.pseudonym, null, 'Compare pseudonym');
    });

    QUnit.test('Update PSEUDONYMIZED add field', assert => {
        assert.expect(4);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        patient.status = PatientStatus.PSEUDONYMIZED;
        patient.pseudonym = "pseudonym";

        mainzelhandler.updateIDAT(patient, { geburtsname: "Hallo" });

        assert.strictEqual(patient.idat.vorname, "a", 'Compare firstname');
        assert.strictEqual(patient.idat.geburtsname, "Hallo", 'Compare birth name');
        assert.strictEqual(patient.status, PatientStatus.CREATED, 'Compare status');
        assert.strictEqual(patient.pseudonym, null, 'Compare pseudonym');
    });

    QUnit.test('Update PSEUDONYMIZED remove field', assert => {
        assert.expect(4);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020, geburtsname: "Hallo" });
        patient.status = PatientStatus.PSEUDONYMIZED;
        patient.pseudonym = "pseudonym";

        mainzelhandler.updateIDAT(patient, { geburtsname: null });

        assert.strictEqual(patient.idat.vorname, "a", 'Compare firstname');
        assert.strictEqual(patient.idat.geburtsname, undefined, 'Compare birth name');
        assert.strictEqual(patient.status, PatientStatus.CREATED, 'Compare status');
        assert.strictEqual(patient.pseudonym, null, 'Compare pseudonym');
    });

    QUnit.test('Update PSEUDONYMIZED same data', assert => {
        assert.expect(7);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        patient.status = PatientStatus.PSEUDONYMIZED;
        patient.pseudonym = "pseudonym";

        mainzelhandler.updateIDAT(patient, { vorname: "a", geburtstag: 20 });
        assert.strictEqual(patient.idat.vorname, "a", 'Compare firstname');
        assert.strictEqual(patient.idat.nachname, "s", 'Compare lastname');
        assert.strictEqual(patient.idat.geburtstag, 20, 'Compare birthday');
        assert.strictEqual(patient.idat.geburtsmonat, 10, 'Compare birth month');
        assert.strictEqual(patient.idat.geburtsjahr, 2020, 'Compare birth year');
        assert.strictEqual(patient.status, PatientStatus.PSEUDONYMIZED, 'Compare status');
        assert.strictEqual(patient.pseudonym, "pseudonym", 'Compare pseudonym');
    });

    QUnit.test('Delete required', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
                mainzelhandler.updateIDAT(patient, { vorname: null });
            },
            /Field with name 'vorname' can not get deleted because it is required!/,
            'Delete vorname'
        );
    });

    QUnit.test('Update wrong type', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
                mainzelhandler.updateIDAT(patient, { vorname: 0 });
            },
            /Field with name 'vorname' of the type 'number' must be of the type 'string'!/,
            'Delete vorname'
        );
    });

    QUnit.test('Add wrong type', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
                mainzelhandler.updateIDAT(patient, { geburtsname: 3 });
            },
            /Field with name 'geburtsname' of the type 'number' must be of the type 'string'!/,
            'Delete vorname'
        );
    });

    QUnit.test('Add invalid field', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
                mainzelhandler.updateIDAT(patient, { pizza: "delicious" });
            },
            /Field with name 'pizza' is not a valid idat field!/,
            'Delete vorname'
        );
    });
});

QUnit.module('updateMDAT', () => {

    QUnit.test('Update CREATED', assert => {
        assert.expect(4);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });

        assert.strictEqual(patient.status, PatientStatus.CREATED, 'Compare status before');
        assert.deepEqual(patient.mdat, "", 'Compare MDAT before');

        const mdat = JSON.stringify({ testProperty: 0 });
        mainzelhandler.updateMDAT(patient, mdat);

        assert.strictEqual(patient.status, PatientStatus.CREATED, 'Compare status after');
        assert.deepEqual(patient.mdat, mdat, 'Compare MDAT after');
    });

    QUnit.test('Update SAVED', assert => {
        assert.expect(4);

        const patient = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        patient.status = PatientStatus.PROCESSED;

        assert.strictEqual(patient.status, PatientStatus.PROCESSED, 'Compare status before');
        assert.deepEqual(patient.mdat, "", 'Compare MDAT before');

        const mdat = JSON.stringify({ testProperty: 0 });
        mainzelhandler.updateMDAT(patient, mdat);

        assert.strictEqual(patient.status, PatientStatus.PSEUDONYMIZED, 'Compare status after');
        assert.deepEqual(patient.mdat, mdat, 'Compare MDAT after');
    });

});

QUnit.module('getPatients', hooks => {

    let patients;

    hooks.before(() => {
        patients = new Map();

        const patient0 = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        patient0.status = PatientStatus.PSEUDONYMIZED;
        patients.set(0, patient0);

        const patient1 = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        patient1.status = PatientStatus.IDAT_CONFLICT;
        patients.set(1, patient1);

        const patient2 = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        patient2.status = PatientStatus.PSEUDONYMIZED;
        patients.set(2, patient2);

        const patient3 = mainzelhandler.createPatient({ vorname: "a", nachname: "s", geburtstag: 20, geburtsmonat: 10, geburtsjahr: 2020 });
        patient3.status = PatientStatus.SAVED;
        patients.set(3, patient3);
    });

    QUnit.test('Find one status', assert => {
        assert.expect(3);

        const result = mainzelhandler.getPatients(patients, PatientStatus.PSEUDONYMIZED);

        assert.strictEqual(result.length, 2, "Check amount of found patients");
        assert.true(result.includes(0), "Found patient 0");
        assert.true(result.includes(2), "Found patient 2");
    });

    QUnit.test('Find multiple status', assert => {
        assert.expect(4);

        const result = mainzelhandler.getPatients(patients, [PatientStatus.PSEUDONYMIZED, PatientStatus.IDAT_CONFLICT]);

        assert.strictEqual(result.length, 3, "Check amount of found patients");
        assert.true(result.includes(0), "Found patient 0");
        assert.true(result.includes(1), "Found patient 1");
        assert.true(result.includes(2), "Found patient 2");
    });

    QUnit.test('Find multiple status from subset', assert => {
        assert.expect(2);

        const result = mainzelhandler.getPatients(patients, [PatientStatus.PSEUDONYMIZED, PatientStatus.IDAT_CONFLICT], [0, 3]);

        assert.strictEqual(result.length, 1, "Check amount of found patients");
        assert.true(result.includes(0), "Found patient 0");
    });
});
