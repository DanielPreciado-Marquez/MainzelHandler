package de.wwu.imi.pseudonym.handler.core.mainzelliste;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.wwu.imi.pseudonym.handler.core.exceptions.MainzellisteConnectionException;
import de.wwu.imi.pseudonym.handler.core.exceptions.MainzellisteRuntimeException;
import de.wwu.imi.pseudonym.handler.core.model.DepseudonymizationUrlResponse;
import de.wwu.imi.pseudonym.handler.core.model.PseudonymizationUrlResponse;

public class MainzellisteSession {

	private static final Logger LOGGER = LoggerFactory.getLogger(MainzellisteSession.class);

	private MainzellisteConnection mainzellisteConnection;
	private String sessionId;

	public MainzellisteSession(final MainzellisteConnection mainzellisteConnection, final String sessionId) {
		this.mainzellisteConnection = mainzellisteConnection;
		this.sessionId = sessionId;
	}

	public String getSessionId() {
		return sessionId;
	}

	public String getSessionUrl() {
		return mainzellisteConnection.getUrl() + "/sessions/" + sessionId;
	}

	/**
	 * Request addPatient tokens from the Mainzelliste. Returns the requested amount
	 * of urls.
	 *
	 * @param amount Amount of requested addPatient token.
	 * @return PseudonymizationUrlResponse containing the array of urls for
	 *         pseudonymizations and the value of useCallback.
	 */
	public PseudonymizationUrlResponse createAddPatientTokens(final HttpClient httpClient, final int amount) {
		LOGGER.info("Requesting " + amount + " 'addPatient' tokens");

		final String[] urlTokens = new String[amount];
		for (int i = 0; i < amount; i++) {
			urlTokens[i] = mainzellisteConnection.getUrl() + "/patients?tokenId=" + createAddPatientToken(httpClient);
		}

		LOGGER.info("Tokens created: " + urlTokens.length);
		return new PseudonymizationUrlResponse(mainzellisteConnection.isUseCallback(), urlTokens);
	}

	/**
	 * Creates an url for the depsudonymization of the given pseudonyms. The url can
	 * be used to depseudonymize all given pseudonyms that are valid. Returns the
	 * url and a list containing all invalid pseudonyms that can't get
	 * depseudonymized with the returned url.
	 *
	 * @param pseudonyms Pseudonyms to depseudonymize.
	 * @return DepseudonymizationResponse containing the url and the invalid
	 *         pseudonyms.
	 */
	public DepseudonymizationUrlResponse createReadPatientsToken(final HttpClient httpClient, final List<String> pseudonyms) {
		LOGGER.info("Requesting 'readPatients' token for " + pseudonyms.size() + " pseudonyms");

		final JSONObject body = new JSONObject();

		body.put("type", "readPatients");

		final JSONObject data = new JSONObject();
		body.put("data", data);

		data.put("resultFields", new JSONArray("['vorname', 'nachname', 'geburtstag', 'geburtsmonat', 'geburtsjahr']"));
		data.put("resultIds", new JSONArray("[pid]"));

		String token = null;
		boolean finished = false;
		final List<String> invalidPseudonyms = new ArrayList<String>();

		while (!finished) {
			finished = true;

			final JSONArray searchIds = new JSONArray();

			for (final String pseudonym : pseudonyms) {
				if (!invalidPseudonyms.contains(pseudonym)) {
					final JSONObject searchId = new JSONObject();
					searchId.put("idType", "pid");
					searchId.put("idString", pseudonym);
					searchIds.put(searchId);
				}
			}

			data.put("searchIds", searchIds);

			try {
				token = getToken(httpClient, body);
			} catch (final MainzellisteRuntimeException exception) {
				final String message = exception.getMessage();

				if (message.contains("Error occured at Mainzelliste: No patient found with provided pid")) {
					final String invalidPseudonym = message.split("'")[1];
					LOGGER.debug("Invalid pseudonym: '" + invalidPseudonym + "'");
					invalidPseudonyms.add(invalidPseudonym);

					if (pseudonyms.size() != invalidPseudonyms.size())
						finished = false;
				} else {
					throw exception;
				}
			}
		}

		final String urlToken = (token != null) ? mainzellisteConnection.getUrl() + "/patients?tokenId=" + token : "";

		return new DepseudonymizationUrlResponse(urlToken, invalidPseudonyms);
	}

	/**
	 * Gets a query token which allows to add a new patient from the Mainzelliste
	 * with given sessionURL.
	 *
	 * @param sessionUrl A session url with a valid session token from the
	 *                   Mainzelliste.
	 * @param httpClient A HTTP-Client for the connection.
	 * @return The query token from the Mainzelliste.
	 */
	private String createAddPatientToken(final HttpClient httpClient) {
		final JSONObject body = new JSONObject();
		final JSONObject data = new JSONObject();

		if (mainzellisteConnection.isUseCallback())
			data.put("callback", mainzellisteConnection.getCallbackUrl());

		body.put("data", data);
		body.put("type", "addPatient");

		final String token = getToken(httpClient, body);

		return token;
	}

	/**
	 * Generates a token at the Mainzelliste in the given session.
	 *
	 * @param sessionUrl URL to a session at the Mainzelliste.
	 * @param httpClient A HTTP-Client for the connection.
	 * @param body       Body of the request containing the data for the token.
	 * @return The token.
	 */
	private String getToken(final HttpClient httpClient, final JSONObject body) {
		final String connectionUrl = getSessionUrl() + "/tokens";

		final HttpPost request = new HttpPost(connectionUrl);
		request.addHeader("content-type", "application/json");
		request.addHeader("mainzellisteApiKey", mainzellisteConnection.getApiKey());
		request.addHeader("mainzellisteApiVersion", mainzellisteConnection.getApiVersion());

		LOGGER.debug("Token request: " + body.toString());
		request.setEntity(new StringEntity(body.toString(), ContentType.APPLICATION_JSON));

		final JSONObject jsonResponse;

		try {
			final HttpResponse httpResponse = httpClient.execute(request);
			final int statusCode = httpResponse.getStatusLine().getStatusCode();
			LOGGER.debug(Integer.toString(statusCode));
			
			final InputStream connectionResponse = httpResponse.getEntity().getContent();
			final String response = IOUtils.toString(connectionResponse, StandardCharsets.UTF_8);

			if (statusCode == 201) {
				LOGGER.debug("Recieved token: " + response);
				jsonResponse = new JSONObject(response);
			} else {
				LOGGER.error("Error occured at Mainzelliste: " + response);
				throw new MainzellisteRuntimeException("Error occured at Mainzelliste: " + response);
			}
		} catch (IOException exception) {
			LOGGER.error("Error while connecting to Mainzelliste: " + exception.getLocalizedMessage(), exception);
			throw new MainzellisteConnectionException(exception.getLocalizedMessage(), exception);
		}

		final String tokenId;

		if (mainzellisteConnection.getApiVersion() == "1.0") {
			tokenId = jsonResponse.getString("tokenId");
		} else {
			tokenId = jsonResponse.getString("id");
		}

		LOGGER.debug("Token created: " + tokenId);

		return tokenId;
	}

}
