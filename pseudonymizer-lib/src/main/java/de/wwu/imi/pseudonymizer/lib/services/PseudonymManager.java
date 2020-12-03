package de.wwu.imi.pseudonymizer.lib.services;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class PseudonymManager {

	private static final Logger LOGGER = org.slf4j.LoggerFactory.getLogger(PseudonymManager.class);

	@Value("${pseudonym-handler.pseudonym-timeout: 600000}")
	private long pseudonymTimeout;

	private Map<String, String> pseudonyms = new HashMap<>();

	private Map<String, Long> creationTimes = new HashMap<>();

	public String putPseudonym(final String requestBody) {
		final JSONObject jsonData = new JSONObject(requestBody);

		final String token = jsonData.getString("tokenId");
		final String pseudonym = jsonData.getString("id");

		return putPseudonym(token, pseudonym);
	}

	public String putPseudonym(final String token, final String pseudonym) {
		LOGGER.debug("Putting: " + token + ", " + pseudonym);
		creationTimes.put(token, System.currentTimeMillis());
		return pseudonyms.put(token, pseudonym);
	}

	public boolean containsToken(final String token) {
		return pseudonyms.containsKey(token);
	}

	public String getPseudonym(final String token) {
		return pseudonyms.get(token);
	}

	public String removeToken(final String token) {
		LOGGER.debug("Removing: " + token);
		creationTimes.remove(token);
		return pseudonyms.remove(token);
	}

	@Scheduled(fixedRate = 60000)
	public void cleanPseudonyms() {
		LOGGER.debug("Started cleaning pseudonyms");

		final long timeoutThreshold = System.currentTimeMillis() - pseudonymTimeout;

		for (final Map.Entry<String, Long> entry : creationTimes.entrySet()) {
			if (entry.getValue() > timeoutThreshold)
				removeToken(entry.getKey());
		}

		LOGGER.debug("Finished cleaning pseudonyms");
	}

}
