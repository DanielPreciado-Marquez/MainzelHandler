package de.wwu.imi.pseudonym.handler.spring;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Configuration class of the pseudonym-handler library. Needs to be included in
 * the application.
 */
@Configuration
@ComponentScan({ "de.wwu.imi.pseudonym.handler.spring.services", "de.wwu.imi.pseudonym.handler.spring.controller" })
@EnableScheduling
public class PseudonymHandlerConfig {

}
