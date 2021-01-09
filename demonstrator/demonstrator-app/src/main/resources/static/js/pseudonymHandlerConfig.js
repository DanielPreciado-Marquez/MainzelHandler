var pseudonymHandlerConfig = {
    idatFields: [
        {
            name: 'vorname',
            type: 'string',
            required: true
        },
        {
            name: 'nachname',
            type: 'string',
            required: true
        },
        {
            name: 'geburtstag',
            type: 'number',
            //type: 'string',
            required: true,
            fixZero: true
        },
        {
            name: 'geburtsmonat',
            type: 'number',
            //type: 'string',
            required: true,
            fixMonth: true,
            fixZero: true
        },
        {
            name: 'geburtsjahr',
            type: 'number',
            //type: 'string',
            required: true
        },
        {
            name: 'geburtsname',
            type: 'string'
        },
        {
            name: 'plz',
            type: 'string'
        },
        {
            name: 'ort',
            type: 'string'
        }
    ],
    mainzellisteApiVersion: '3.0',
    serverURL: null
}

export default pseudonymHandlerConfig;
