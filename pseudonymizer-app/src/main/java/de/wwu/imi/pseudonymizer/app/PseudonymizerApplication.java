package de.wwu.imi.pseudonymizer.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

import de.wwu.imi.pseudonymizer.lib.PseudonymizerLibConfig;

@SpringBootApplication
@Import(PseudonymizerLibConfig.class)
public class PseudonymizerApplication {

	public static void main(String[] args) {
		SpringApplication.run(PseudonymizerApplication.class, args);
	}

}
