var pseudonymHandlerConfig = {
    idatFields: {
        'vorname': {
            type: 'string',
            required: true
        },
        'nachname': {
            type: 'string',
            required: true
        },
        'geburtstag': {
            type: 'number',
            //type: 'string',
            required: true,
            fixZero: true
        },
        'geburtsmonat': {
            type: 'number',
            //type: 'string',
            required: true,
            fixMonth: true,
            fixZero: true
        },
        'geburtsjahr': {
            type: 'number',
            //type: 'string',
            required: true
        },
        'geburtsname': {
            type: 'string'
        },
        'plz': {
            type: 'string'
        },
        'ort': {
            type: 'string'
        }
    },
    mainzellisteApiVersion: '3.0',
    serverURL: null
}

export default pseudonymHandlerConfig;
