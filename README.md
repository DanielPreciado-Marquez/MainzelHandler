# Mainzelhandler
Mainzelhandler is a library for an easy integration of the [Mainzelliste](https://www.unimedizin-mainz.de/imbei/informatik/ag-verbundforschung/mainzelliste.html) into a web application.

## Demonstrator
The [Demonstrator](/mainzelhandler-demonstrator) is an example web application using the Mainzelhandler.

### Running the Demonstrator
Currently, there are two ways to run the Demonstrator.
Both methods require the following parameters to be defined in the environment.

Paremeter | Desription
------------- | -------------
spring.datasource.url | URL of the database
mainzelhandler.mainzelliste.url | URL of the Mainzelliste
mainzelhandler.mainzelliste.api.key | API key of the Mainzelliste
mainzelhandler.url | URL of the Demonstrator, used for the callback request from the Mainzelliste

#### IDE
You can run the application directly in your IDE. You need a running instance of the Mainzelliste and a database. The SQL file for the database can be found [here](/mainzelhandler-demonstrator/db/demonstrator.sql).
You can define the mentioned parameters for example in the application.yml.

#### Docker

You can also run the Demonstrator via docker-compose. A docker-compose file containing the web application and the database can be found [here](/mainzelhandler-demonstrator/docker-compose.yml). There is also a completely configured docker-compose file containing the Demonstrator and the Mainzelliste [here](/mainzelhandler-demonstrator/docker-compose-example.yml).
