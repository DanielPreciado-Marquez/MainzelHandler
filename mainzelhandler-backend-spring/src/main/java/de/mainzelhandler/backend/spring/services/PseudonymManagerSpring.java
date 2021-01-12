package de.mainzelhandler.backend.spring.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import de.mainzelhandler.backend.core.services.PseudonymManager;

/**
 * Service for temporary storage of token and pseudonyms.
 */
@Service
public class PseudonymManagerSpring extends PseudonymManager {

	public PseudonymManagerSpring(@Value("${mainzelhandler.pseudonym-timeout:300000}") final long pseudonymTimeout) {
		super(pseudonymTimeout);
	}

	/**
	 * Cleans the timeouted pseudonyms. Called by Spring Boot every 5 minutes.
	 */
	@Scheduled(fixedRate = 300000)
	public void cleanPseudonymsSchedule() {
		cleanPseudonyms();
	}

}
