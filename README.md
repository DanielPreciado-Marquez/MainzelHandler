# BA_Daniel_Preciado-Marquez

Thema: Bibliothek für TMF-konforme Pseudonymisierung

## Current Architecture
```
Client (Browser)             Pseudonymizer (this server)            Mainzelliste
--------------------------------------------------------------------------------
visits pseudonymizer URL
enters pii about patient
hits button --------------->
                             getSessionURL(api key)----------------->
                                                 <------------------ generates Session URL
                             getTokenID(sessionUrl)----------------->
                                                 <------------------ generates token
            <--------------- returns tokenized URL
sends pii to token URL --------------------------------------------->
            <------------------------------------------------------- returns pseudonym
```