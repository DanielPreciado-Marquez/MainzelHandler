package de.wwu.imi.pseudonymizer.lib.controller;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import de.wwu.imi.pseudonymizer.lib.exceptions.MainzellisteConnectionException;
import de.wwu.imi.pseudonymizer.lib.exceptions.MainzellisteException;
import de.wwu.imi.pseudonymizer.lib.model.DepseudonymizationResponse;
import de.wwu.imi.pseudonymizer.lib.model.Patient;

/**
 * Controller that can talk to the Mainzelliste service. Its main purpose is to
 * get a URL from the Mainzelliste that contains session and query tokens and is
 * ready to be used to pseudonymize a patient.
 *
 * That way the pii (personally identifiable information) doesn't have to be
 * sent to this controller and instead the client can do the pseudonymization
 * themselves by sending the pii to the mainzelliste URL mentioned above.
 *
 * @see <a href=
 *      "https://bitbucket.org/medicalinformatics/mainzelliste/src/master/">Mainzelliste
 *      Source Code</a>
 */
public abstract class AbstractPseudonymizationController {

	private static final Logger LOGGER = org.slf4j.LoggerFactory.getLogger(AbstractPseudonymizationController.class);

	/**
	 * URL to the Mainzelliste.
	 */
	@Value("${mainzelliste.url}")
	private String mainzellisteUrl;

	/**
	 * API-Key for the Mainzelliste.
	 */
	@Value("${mainzelliste.apikey}")
	private String mainzellisteApiKey;

	/**
	 * Handles the tokening with the Mainzelliste and returns an Array of urls
	 * containing the token.
	 *
	 * @param amount Amount of tokens.
	 * @return Array of urls for pseudonymizations.
	 */
	@GetMapping("/tokens/addPatient/{amount}")
	public final String[] getPseudonymizationURL(@PathVariable("amount") final String amount) {

		final var amountParsed = Integer.parseInt(amount);
		LOGGER.info("Requesting " + amount + " 'addPatient' tokens");

		HttpClient httpClient = HttpClientBuilder.create().build();
		String sessionURL = getSessionURL(httpClient);

		var urlTokens = new String[amountParsed];
		for (int i = 0; i < amountParsed; i++) {
			urlTokens[i] = mainzellisteUrl + "patients?tokenId=" + getAddPatientToken(sessionURL, httpClient);
		}

		LOGGER.info("Tokens created: " + urlTokens.length);
		return urlTokens;
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
	@PostMapping("/tokens/readPatients")
	public final DepseudonymizationResponse getDepseudonymizationURL(@RequestBody final List<String> pseudonyms) {
		LOGGER.info("Requesting 'readPatients' token for " + pseudonyms.size() + " pseudonyms");

		HttpClient httpClient = HttpClientBuilder.create().build();

		String sessionURL = getSessionURL(httpClient);

		final ImmutablePair<String, List<String>> result = getReadPatientsToken(sessionURL, httpClient, pseudonyms);
		final String token = result.getLeft();
		final List<String> invalidpseudonyms = result.getRight();

		final String urlToken = (token != null) ? mainzellisteUrl + "patients?tokenId=" + token : "";

		return new DepseudonymizationResponse(urlToken, invalidpseudonyms);
	}

	/**
	 * Accepts a list of patients to be handled by the application.
	 *
	 * @param patients List of patients.
	 */
	@PostMapping("/patients/send")
	public final List<Boolean> acceptPatientsRequest(@RequestBody final List<Patient> patients) {
		return acceptPatients(patients);
	}

	/**
	 * Request the mdat of the given patients. The returned mdat is in the same
	 * order as the given pseudonyms. If the mdat is not available, an empty String
	 * will be returned.
	 *
	 * @param pseudonyms List of pseudonyms of the requsted patients.
	 * @return List of mdat.
	 */
	@PostMapping("/patients/request")
	public final List<String> requestPatientsRequest(@RequestBody final List<String> pseudonyms) {
		final var patients = requestPatients(pseudonyms);
		final var mdat = patients.stream().map(patient -> patient.getMdatString()).collect(Collectors.toList());
		return mdat;
	}

	@ExceptionHandler({ MainzellisteException.class, MainzellisteConnectionException.class })
	public ResponseEntity<Object> handlePseudonymizationServerException(final Exception exception) {
		return new ResponseEntity<>(exception.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
	}

	/**
	 * Abstract method to be implemented in the application.
	 *
	 * @param patients List of patients.
	 * @return List containing boolean that indicates if the patients got processed
	 *         successfully.
	 */
	public abstract List<Boolean> acceptPatients(final List<Patient> patients);

	/**
	 * Abstract method to be implemented in the application.
	 *
	 * @param pseudonyms List of pseudonyms.
	 * @return List containing the requested patients.
	 */
	public abstract List<Patient> requestPatients(final List<String> pseudonyms);

	/**
	 * Gets a session url with a valid session token from the pseudonymization
	 * server with configured baseURL.
	 *
	 * @param httpClient A HTTP-Client for the connection.
	 * @return The session url with a valid session token from the pseudonymization
	 *         server.
	 */
	private final String getSessionURL(final HttpClient httpClient) {
		LOGGER.debug("Creating new session url");

		final String connectionUrl = mainzellisteUrl + "sessions/";

		final HttpPost request = new HttpPost(connectionUrl);
		request.addHeader("mainzellisteApiKey", mainzellisteApiKey);

		JSONObject jsonResponse;

		try {
			final HttpResponse httpResponse = httpClient.execute(request);
			final InputStream connectionResponse = httpResponse.getEntity().getContent();
			final String response = IOUtils.toString(connectionResponse, StandardCharsets.UTF_8);
			jsonResponse = new JSONObject(response);
		} catch (Exception exception) {
			LOGGER.error("Error while connecting to Mainzelliste: " + exception.getLocalizedMessage(), exception);
			throw new MainzellisteConnectionException(exception.getLocalizedMessage(), exception);
		}

		final String uri = jsonResponse.getString("uri");
		LOGGER.debug("Session url: " + uri);

		return uri;
	}

	/**
	 * Gets a query token which allows to add a new patient from the
	 * pseudonymization server with given sessionURL.
	 *
	 * @param sessionUrl A session url with a valid session token from the
	 *                   pseudonymization server.
	 * @param httpClient A HTTP-Client for the connection.
	 * @return The query token from the pseudonymization server.
	 */
	private final String getAddPatientToken(final String sessionUrl, final HttpClient httpClient) {
		final JSONObject body = new JSONObject();
		final JSONObject callback = new JSONObject();
		body.put("data", callback);
		body.put("type", "addPatient");

		final String token = getToken(sessionUrl, httpClient, body);

		return token;
	}

	/**
	 * Creates a 'readPatients' token at the Mainzelliste. the token can read the
	 * IDAT of every given and valid pseudonym. Returns the token and a list of all
	 * invalid pseudonyms.
	 *
	 * @param sessionUrl A session url with a valid session token from the
	 *                   pseudonymization server.
	 * @param httpClient A HTTP-Client for the connection.
	 * @param pseudonyms List of pseudonyms to get depseudonymized.
	 * @return Pair containing the URL and the invalid pseudonyms.
	 */
	private final ImmutablePair<String, List<String>> getReadPatientsToken(final String sessionUrl,
			final HttpClient httpClient, final List<String> pseudonyms) {

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
				token = getToken(sessionUrl, httpClient, body);
			} catch (final MainzellisteException exception) {
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

		return ImmutablePair.of(token, invalidPseudonyms);
	}

	/**
	 * Generates a token at the Mainzelliste in the given session.
	 *
	 * @param sessionUrl URL to a session at the Mainzelliste.
	 * @param httpClient A HTTP-Client for the connection.
	 * @param body       Body of the request containing the data for the token.
	 * @return The token.
	 */
	private final String getToken(final String sessionUrl, final HttpClient httpClient, final JSONObject body) {
		final String connectionUrl = sessionUrl + "tokens/";

		final HttpPost request = new HttpPost(connectionUrl);
		request.addHeader("content-type", "application/json");
		request.addHeader("mainzellisteApiKey", mainzellisteApiKey);

		LOGGER.debug("Token request: " + body.toString());
		request.setEntity(new StringEntity(body.toString(), ContentType.APPLICATION_JSON));

		JSONObject jsonResponse;

		try {
			final HttpResponse httpResponse = httpClient.execute(request);
			final int statusCode = httpResponse.getStatusLine().getStatusCode();

			final InputStream connectionResponse = httpResponse.getEntity().getContent();
			final String response = IOUtils.toString(connectionResponse, StandardCharsets.UTF_8);

			// TODO: more statusCodes?
			if (statusCode == 400 || statusCode == 500)
				throw new MainzellisteException("Error occured at Mainzelliste: " + response);

			jsonResponse = new JSONObject(response);
		} catch (IOException exception) {
			LOGGER.error("Error while connecting to Mainzelliste: " + exception.getLocalizedMessage(), exception);
			throw new MainzellisteConnectionException(exception.getLocalizedMessage(), exception);
		}

		final String tokenId = jsonResponse.getString("tokenId");
		LOGGER.debug("Token created: " + tokenId);

		return tokenId;
	}

}
