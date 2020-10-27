package de.wwu.imi.pseudonymizer.lib.controller;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;
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

import de.wwu.imi.pseudonymizer.lib.exceptions.PseudonymizationServerException;
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
	 * Handles the tokening with the pseudonymization server and returns an Array of
	 * urls containing the token.
	 *
	 * @param type   Type of the token.
	 * @param amount Amount of tokens.
	 * @return An array of urls with the appropriate token.
	 */
	@GetMapping("/tokens/addPatient/{amount}")
	public final String[] getPseudonymizationURL(@PathVariable("amount") final String amount) {

		final var amountParsed = Integer.parseInt(amount);
		LOGGER.info("Requesting " + amount + " 'addPatient' tokens");

		HttpClient httpClient = HttpClientBuilder.create().build();
		String sessionURL = getSessionURL(httpClient);
		LOGGER.debug("Session url: " + sessionURL);

		var urlTokens = new String[amountParsed];
		for (int i = 0; i < amountParsed; i++) {
			urlTokens[i] = mainzellisteUrl + "patients?tokenId=" + getAddPatientToken(sessionURL, httpClient);
			LOGGER.trace(i + ". token url: " + urlTokens[i]);
		}

		LOGGER.debug("Tokens created: " + urlTokens.length);
		return urlTokens;
	}

	/**
	 * Accepts a list of patients to be handled by the application.
	 *
	 * @param patients List of patients.
	 */
	@PostMapping("/patients/send")
	public final void acceptPatientsRequest(@RequestBody final List<Patient> patients) {
		acceptPatients(patients);
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

	@ExceptionHandler(PseudonymizationServerException.class)
	public ResponseEntity<Object> handlePseudonymizationServerException(
			final PseudonymizationServerException exception) {
		return new ResponseEntity<>(exception.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
	}

	public abstract void acceptPatients(final List<Patient> patients);

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
		final String connectionUrl = mainzellisteUrl + "sessions/";

		final HttpPost request = new HttpPost(connectionUrl);
		request.addHeader("mainzellisteApiKey", mainzellisteApiKey);

		JSONObject jsonResponse;

		try {
			final HttpResponse httpResponse = httpClient.execute(request);
			final InputStream connectionResponse = httpResponse.getEntity().getContent();
			final String response = IOUtils.toString(connectionResponse, StandardCharsets.UTF_8);
			jsonResponse = new JSONObject(response);
		} catch (IOException exception) {
			LOGGER.error("Error while connecting to the pseudonymization server: " + exception.getLocalizedMessage(),
					exception);
			throw new PseudonymizationServerException(exception.getLocalizedMessage(), exception);
		}

		return jsonResponse.getString("uri");
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
		final String connectionUrl = sessionUrl + "tokens/";

		final HttpPost request = new HttpPost(connectionUrl);
		request.addHeader("content-type", "application/json");
		request.addHeader("mainzellisteApiKey", mainzellisteApiKey);

		final JSONObject type = new JSONObject();
		final JSONObject callback = new JSONObject();
		type.put("data", callback);
		type.put("type", "addPatient");

		request.setEntity(new StringEntity(type.toString(), ContentType.APPLICATION_JSON));

		JSONObject jsonResponse;

		try {
			final HttpResponse httpResponse = httpClient.execute(request);
			final InputStream connectionResponse = httpResponse.getEntity().getContent();
			final String response = IOUtils.toString(connectionResponse, StandardCharsets.UTF_8);
			jsonResponse = new JSONObject(response);
		} catch (IOException exception) {
			LOGGER.error("Error while connecting to the pseudonymization server: " + exception.getLocalizedMessage(),
					exception);
			throw new PseudonymizationServerException(exception.getLocalizedMessage(), exception);
		}

		return jsonResponse.getString("tokenId");
	}

}
