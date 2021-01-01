package de.wwu.imi.pseudonym.handler.spring.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import de.wwu.imi.pseudonym.handler.core.services.PseudonymManager;

/**
 * Service for temporarily storing token and pseudonyms.
 */
@Service
public class PseudonymManagerSpring extends PseudonymManager {

	public PseudonymManagerSpring(@Value("${pseudonym-handler.pseudonym-timeout:300000}") final long pseudonymTimeout) {
		super(pseudonymTimeout);
	}

	/**
	 * Cleans the timeouted pseudonyms.
	 */
	@Scheduled(fixedRate = 60000)
	public void cleanPseudonymsSchedule() {
		cleanPseudonyms();
	}

}
