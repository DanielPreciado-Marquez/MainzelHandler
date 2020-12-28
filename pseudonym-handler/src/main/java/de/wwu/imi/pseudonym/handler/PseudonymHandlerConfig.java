package de.wwu.imi.pseudonym.handler;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Configuration class of the pseudonym-handler library. Needs to be included in
 * the application.
 */
@Configuration
@ComponentScan({ "de.wwu.imi.pseudonym.handler.services" })
@EnableScheduling
public class PseudonymHandlerConfig {

}
