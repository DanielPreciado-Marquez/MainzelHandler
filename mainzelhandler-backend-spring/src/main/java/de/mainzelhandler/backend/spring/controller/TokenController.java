package de.mainzelhandler.backend.spring.controller;

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

import de.mainzelhandler.backend.core.exceptions.MainzellisteConnectionException;
import de.mainzelhandler.backend.core.exceptions.MainzellisteRuntimeException;
import de.mainzelhandler.backend.core.interfaces.TokenInterface;
import de.mainzelhandler.backend.core.mainzelliste.MainzellisteConnection;
import de.mainzelhandler.backend.core.mainzelliste.MainzellisteSession;
import de.mainzelhandler.backend.core.model.DepseudonymizationUrlRequest;
import de.mainzelhandler.backend.core.model.DepseudonymizationUrlResponse;
import de.mainzelhandler.backend.core.model.PseudonymizationUrlRequest;
import de.mainzelhandler.backend.core.model.PseudonymizationUrlResponse;

/**
 * Interface for the token resource.
 */
@RequestMapping("${mainzelhandler.request-path:}/tokens")
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
	public TokenController(@Value("${mainzelhandler.mainzelliste.url}") final String mainzellisteUrl,
			@Value("${mainzelhandler.mainzelliste.api.key}") final String mainzellisteApiKey,
			@Value("${mainzelhandler.mainzelliste.api.version:3.0}") final String mainzellisteApiVersion,
			@Value("${server.port}") final String serverPort,
			@Value("${server.servlet.context-path}") final String contextPath,
			@Value("${mainzelhandler.request-path:}") final String requestPath,
			@Value("${mainzelhandler.url}") final String serverUrl,
			@Value("${mainzelhandler.useCallback:false}") final boolean useCallback) {

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
