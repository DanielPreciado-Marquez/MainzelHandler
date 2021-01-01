package de.wwu.imi.demonstrator.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import de.wwu.imi.pseudonym.handler.spring.PseudonymHandlerConfig;

@SpringBootApplication
@Import(PseudonymHandlerConfig.class)
@EntityScan("de.wwu.imi.demonstrator.app.entities")
@EnableJpaRepositories
@ComponentScan("de.wwu.imi.demonstrator.app.controller")
public class DemonstratorApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemonstratorApplication.class, args);
	}

}
