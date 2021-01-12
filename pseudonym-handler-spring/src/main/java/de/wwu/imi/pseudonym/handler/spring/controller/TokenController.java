package de.wwu.imi.pseudonym.handler.spring.controller;

import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.wwu.imi.pseudonym.handler.core.exceptions.MainzellisteConnectionException;
import de.wwu.imi.pseudonym.handler.core.exceptions.MainzellisteRuntimeException;
import de.wwu.imi.pseudonym.handler.core.interfaces.TokenInterface;
import de.wwu.imi.pseudonym.handler.core.mainzelliste.MainzellisteConnection;
import de.wwu.imi.pseudonym.handler.core.mainzelliste.MainzellisteSession;
import de.wwu.imi.pseudonym.handler.core.model.DepseudonymizationUrlRequest;
import de.wwu.imi.pseudonym.handler.core.model.DepseudonymizationUrlResponse;
import de.wwu.imi.pseudonym.handler.core.model.PseudonymizationUrlRequest;
import de.wwu.imi.pseudonym.handler.core.model.PseudonymizationUrlResponse;

/**
 * Interface for the token resource.
 */
@RequestMapping("${pseudonym-handler.request-path:}/tokens")
@RestController
public class TokenController implements TokenInterface {

	/**
	 * Connection to the Mainzelliste.
	 */
	private MainzellisteConnection mainzellisteConnection;

	/**
	 * Construct a new TokenContoller.
	 *
	 * @param mainzellisteUrl        URL of the Mainzelliste.
	 * @param mainzellisteApiKey     API key of the Mainzelliste.
	 * @param mainzellisteApiVersion API version of the Mainzelliste to use.
	 * @param serverPort             Port of the application.
	 * @param contextPath            Context path of the application.
	 * @param requestPath            Path of the controller.
	 * @param serverUrl              URL of the application's server
	 * @param useCallback            Whether the callback function of the
	 *                               Mainzelliste should be activated.
	 */
	public TokenController(@Value("${pseudonym-handler.mainzelliste.url}") final String mainzellisteUrl,
			@Value("${pseudonym-handler.mainzelliste.api.key}") final String mainzellisteApiKey,
			@Value("${pseudonym-handler.mainzelliste.api.version:3.0}") final String mainzellisteApiVersion,
			@Value("${server.port}") final String serverPort,
			@Value("${server.servlet.context-path}") final String contextPath,
			@Value("${pseudonym-handler.request-path:}") final String requestPath,
			@Value("${pseudonym-handler.url}") final String serverUrl,
			@Value("${pseudonym-handler.useCallback:false}") final boolean useCallback) {

		final String callbackUrl = serverUrl + ":" + serverPort + contextPath + requestPath
				+ "/patients/send/pseudonyms";

		mainzellisteConnection = new MainzellisteConnection(callbackUrl, useCallback, mainzellisteApiKey,
				mainzellisteApiVersion, mainzellisteUrl);
	}

	/**
	 * Request addPatient tokens from the Mainzelliste. Returns the requested amount
	 * of urls.
	 *
	 * @param amount Amount of requested addPatient token.
	 * @return PseudonymizationUrlResponse containing the array of urls for
	 *         pseudonymizations and the value of useCallback.
	 */
	@PostMapping("/addPatient")
	public PseudonymizationUrlResponse getPseudonymizationUrl(@RequestBody final PseudonymizationUrlRequest request) {
		final HttpClient httpClient = HttpClientBuilder.create().build();
		final MainzellisteSession session = mainzellisteConnection.createMainzellisteSession(httpClient);
		return session.createAddPatientTokens(httpClient, request.getCount());
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
	@PostMapping("/readPatients")
	public DepseudonymizationUrlResponse getDepseudonymizationUrl(
			@RequestBody final DepseudonymizationUrlRequest request) {
		final HttpClient httpClient = HttpClientBuilder.create().build();
		final MainzellisteSession session = mainzellisteConnection.createMainzellisteSession(httpClient);
		return session.createReadPatientsToken(httpClient, request.getPseudonyms(), request.getResultFields());
	}

	@ExceptionHandler({ MainzellisteRuntimeException.class, MainzellisteConnectionException.class })
	public final ResponseEntity<Object> handlePseudonymizationServerException(final Exception exception) {
		return new ResponseEntity<>(exception.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
	}

}
