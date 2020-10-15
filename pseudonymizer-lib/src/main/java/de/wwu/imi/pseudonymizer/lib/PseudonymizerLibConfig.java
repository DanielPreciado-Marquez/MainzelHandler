package de.wwu.imi.pseudonymizer.lib;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EntityScan("de.wwu.imi.pseudonymizer.lib.entities")
@EnableJpaRepositories
@ComponentScan("de.wwu.imi.pseudonymizer.lib.controller")
@PropertySource("classpath:library.properties")
public class PseudonymizerLibConfig {

}
