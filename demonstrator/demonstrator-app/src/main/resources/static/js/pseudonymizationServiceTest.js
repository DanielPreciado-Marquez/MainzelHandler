'use strict';

QUnit.config.autostart = false;

var pseudonymizationService;

window.onload = function () {
    pseudonymizationService = new PseudonymizationService(contextPath);
    QUnit.start();
}

QUnit.module('createIDAT', () => {

    QUnit.test('Create IDAT with a string for the Date', assert => {

        const idat = pseudonymizationService.createIDAT("a", "s", "08-10-2020");

        assert.strictEqual(idat.birthday.getTime(), new Date("08-10-2020").getTime(), 'Compare birthday');
        assert.strictEqual(idat.firstname, "a", 'Compare firstname');
        assert.strictEqual(idat.lastname, "s", 'Compare lastname');
    });

    QUnit.test('Create IDAT with a number for the Date', assert => {

        const idat = pseudonymizationService.createIDAT(" q", "w ", 12);

        assert.strictEqual(idat.birthday.getTime(), new Date(12).getTime(), 'Compare birthday');
        assert.strictEqual(idat.firstname, "q", 'Compare firstname');
        assert.strictEqual(idat.lastname, "w", 'Compare lastname');
    });

    QUnit.test('Create IDAT with a Date for the Date', assert => {

        const idat = pseudonymizationService.createIDAT("e", " r ", new Date("10-10-2020"));

        assert.strictEqual(idat.birthday.getTime(), new Date("10-10-2020").getTime(), 'Compare birthday');
        assert.strictEqual(idat.firstname, "e", 'Compare firstname');
        assert.strictEqual(idat.lastname, "r", 'Compare lastname');
    });

    QUnit.test('Invalid firstname', assert => {

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
    });
});
