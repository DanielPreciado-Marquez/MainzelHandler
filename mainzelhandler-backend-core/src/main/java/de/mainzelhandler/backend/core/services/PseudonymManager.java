package de.mainzelhandler.backend.core.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.function.Function;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.mainzelhandler.backend.core.model.Patient;

/**
 * Service for temporarily storing token and pseudonyms.
 */
public class PseudonymManager {

	private static final Logger LOGGER = LoggerFactory.getLogger(PseudonymManager.class);

	/**
	 * Timeout of pseudonyms in seconds.
	 */
	private long pseudonymTimeout;

	/**
	 * Map containing the tokens as keys and the pseudonyms as values.
	 */
	private Map<String, String> pseudonyms;

	/**
	 * Map containing the tokens as keys and the creation time as values. Used to
	 * determine the timeout.
	 */
	private Map<String, Long> creationTimes;

	public PseudonymManager(final long pseudonymTimeout) {
		this.pseudonymTimeout = pseudonymTimeout;
		this.pseudonyms = new HashMap<String, String>();
		this.creationTimes = new HashMap<String, Long>();
	}

	/**
	 * Stores a token-pseudonym pair. Takes the body of the callback request from
	 * the Mainzelliste as an argument. Can process the request body up to
	 * Mainzelliste api version 3.0
	 *
	 * @param requestBody Request body from the callback request
	 * @return The previous pseudonym associated with token, or null if there was no
	 *         mapping for token.
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
	public void cleanPseudonyms() {
		LOGGER.debug("Started cleaning pseudonyms");

		final long timeoutThreshold = System.currentTimeMillis() - pseudonymTimeout;

		for (final Map.Entry<String, Long> entry : creationTimes.entrySet()) {
			if (entry.getValue() > timeoutThreshold)
				removeToken(entry.getKey());
		}

		LOGGER.debug("Finished cleaning pseudonyms");
	}

	/**
	 * Utility function to exchange the tokens with the pseudonyms and back. If
	 * useCallback is true, it exchanges the tokens of the given patients with the
	 * corresponding stored pseudonyms, calls the given function and exchanges the
	 * pseudonyms in the returned Map back with the token. If useCallback is false,
	 * it passes the arguments to the function and returns the result without any
	 * exchanges.
	 *
	 * @param patients        Patients to be processed by the application.
	 * @param processFunction Function to be called for the processing.
	 * @param useCallback     Whether the callback function is active.
	 * @return The result of the processFunction.
	 */
	public Map<String, Boolean> processPatients(final List<Patient> patients,
			final Function<List<Patient>, Map<String, Boolean>> processFunction, final boolean useCallback) {
		final Map<String, Boolean> result;

		if (useCallback) {

			final Map<String, String> pseudonyms = new HashMap<String, String>();

			final List<Patient> pseudonymizedPatients = new ArrayList<Patient>();

			for (final Patient patient : patients) {
				final String token = patient.getPseudonym();

				if (containsToken(token)) {
					final String pseudonym = removeToken(token);
					pseudonyms.put(pseudonym, token);
					patient.setPseudonym(pseudonym);
					pseudonymizedPatients.add(patient);
				} else {
					LOGGER.debug("No corresponding pseudonym found for token: " + token);
				}
			}

			final Map<String, Boolean> resultIntermediate = processFunction.apply(pseudonymizedPatients);
			result = new HashMap<String, Boolean>();

			for (final Entry<String, Boolean> entry : resultIntermediate.entrySet()) {
				result.put(pseudonyms.get(entry.getKey()), entry.getValue());
			}

		} else {
			result = processFunction.apply(patients);
		}

		return result;
	}

	/**
	 * Utility function to exchange the token with the corresponding pseudonyms. If
	 * useCallback is true, it exchanges the tokens with the corresponding stored
	 * pseudonyms, calls the given function and exchanges the pseudonyms of the
	 * returned patients back with the token. If useCallback is false, it passes the
	 * arguments to the function and returns the result without any exchanges.
	 *
	 * @param ids             Id's of the patients to be returned.
	 * @param processFunction Function to return the requested patients.
	 * @param useCallback     Whether the callback function is active.
	 * @return Returned Patients of the processFunction.
	 */
	public List<Patient> processRequest(final List<String> ids,
			final Function<List<String>, List<Patient>> processFunction, final boolean useCallback) {
		final List<Patient> patients;

		if (useCallback) {
			// ids are token
			final Map<String, String> pseudonymsAndTokens = new HashMap<String, String>();

			for (final String token : ids) {
				if (containsToken(token)) {
					pseudonymsAndTokens.put(removeToken(token), token);
				} else {
					LOGGER.debug("No corresponding pseudonym found for token: " + token);
				}
			}

			patients = processFunction.apply(new ArrayList<String>(pseudonymsAndTokens.keySet()));

			for (final Patient patient : patients) {
				patient.setPseudonym(pseudonymsAndTokens.get(patient.getPseudonym()));
			}

		} else {
			// ids are pseudonyms
			patients = processFunction.apply(ids);
		}

		return patients;
	}

}
