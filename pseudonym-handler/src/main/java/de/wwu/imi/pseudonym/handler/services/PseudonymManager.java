package de.wwu.imi.pseudonym.handler.services;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Service for temporarily storing token and pseudonyms.
 */
@Service
public class PseudonymManager {

	private static final Logger LOGGER = org.slf4j.LoggerFactory.getLogger(PseudonymManager.class);

	/**
	 * Timeout of pseudonyms in seconds.
	 */
	@Value("${pseudonym-handler.pseudonym-timeout: 600000}")
	private long pseudonymTimeout;

	/**
	 * Map containing the tokens as keys and the pseudonyms as values.
	 */
	private Map<String, String> pseudonyms = new HashMap<>();

	/**
	 * Map containing the tokens as keys and the creation time as values. Used to
	 * determine the timeout.
	 */
	private Map<String, Long> creationTimes = new HashMap<>();

	/**
	 * Stores a token-pseudonym pair. Takes the body of the callback request from
	 * the Mainzelliste as an argument. Can process the request body up to
	 * Mainzelliste api version 3.0
	 *
	 * @param requestBody Request body from the callback request
	 * @return
	 */
	public String putPseudonym(final String requestBody) {
		final JSONObject jsonData = new JSONObject(requestBody);

		final String token = jsonData.getString("tokenId");
		final String pseudonym;

		if (jsonData.has("id")) {
			pseudonym = jsonData.getString("id");
		} else {
			pseudonym = jsonData.getJSONArray("ids").getJSONObject(0).getString("idString");
		}

		return putPseudonym(token, pseudonym);
	}

	/**
	 * Stores a token-pseudonym pair. Saves the time stamp in
	 * {@link #creationTimes}.
	 *
	 * @param token     The token.
	 * @param pseudonym The pseudonym.
	 * @return The previous pseudonym associated with token, or null if there was no
	 *         mapping for token.
	 */
	public String putPseudonym(final String token, final String pseudonym) {
		LOGGER.debug("Putting: " + token + ", " + pseudonym);
		creationTimes.put(token, System.currentTimeMillis());
		return pseudonyms.put(token, pseudonym);
	}

	/**
	 * Returns true if the service has saved the specified token.
	 *
	 * @param token Token whose presence is to be tested
	 * @return true if this map contains a mapping for the specified token.
	 */
	public boolean containsToken(final String token) {
		return pseudonyms.containsKey(token);
	}

	/**
	 * Returns the pseudonym associated with the token or null if the token is not
	 * present.
	 *
	 * @param token The token.
	 * @return The associated pseudonym or null.
	 */
	public String getPseudonym(final String token) {
		return pseudonyms.get(token);
	}

	/**
	 * Removes the specified token if present.
	 *
	 * @param token The token to be removed.
	 * @return The associated pseudonym.
	 */
	public String removeToken(final String token) {
		creationTimes.remove(token);
		final String pseudonym = pseudonyms.remove(token);
		LOGGER.debug("Removing: " + token + ", " + pseudonym);
		return pseudonym;
	}

	/**
	 * Cleans the timeouted pseudonyms.
	 */
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
