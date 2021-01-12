package de.mainzelhandler.backend.spring;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Configuration class of the pseudonym-handler library. Needs to be included in
 * the application.
 */
@Configuration
@ComponentScan({ "de.mainzelhandler.backend.spring.services", "de.mainzelhandler.backend.spring.controller" })
@EnableScheduling
public class PseudonymHandlerConfig {

}
