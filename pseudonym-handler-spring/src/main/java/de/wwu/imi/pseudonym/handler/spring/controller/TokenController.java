package de.wwu.imi.pseudonym.handler.spring.controller;

import java.util.List;

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
import de.wwu.imi.pseudonym.handler.core.model.DepseudonymizationUrlResponse;
import de.wwu.imi.pseudonym.handler.core.model.PseudonymizationUrlResponse;

@RequestMapping("${pseudonym-handler.request-path:}/tokens")
@RestController
public class TokenController implements TokenInterface {

	private MainzellisteConnection mainzellisteConnection;

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
	public PseudonymizationUrlResponse getPseudonymizationUrl(@RequestBody final int amount) {
		final HttpClient httpClient = HttpClientBuilder.create().build();
		final MainzellisteSession session = mainzellisteConnection.createMainzellisteSession(httpClient);
		return session.createAddPatientTokens(httpClient, amount);
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
	public DepseudonymizationUrlResponse getDepseudonymizationUrl(@RequestBody final List<String> pseudonyms) {
		final HttpClient httpClient = HttpClientBuilder.create().build();
		final MainzellisteSession session = mainzellisteConnection.createMainzellisteSession(httpClient);
		return session.createReadPatientsToken(httpClient, pseudonyms);
	}

	@ExceptionHandler({ MainzellisteRuntimeException.class, MainzellisteConnectionException.class })
	public final ResponseEntity<Object> handlePseudonymizationServerException(final Exception exception) {
		return new ResponseEntity<>(exception.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
	}

}
