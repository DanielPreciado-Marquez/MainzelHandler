package de.wwu.imi.pseudonymizer.lib;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@ComponentScan({"de.wwu.imi.pseudonymizer.lib.services"})
@EnableScheduling
public class PseudonymizationLibConfig {

}
