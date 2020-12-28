package de.wwu.imi.pseudonym.handler;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@ComponentScan({"de.wwu.imi.pseudonym.handler.services"})
@EnableScheduling
public class PseudonymHandlerConfig {

}
