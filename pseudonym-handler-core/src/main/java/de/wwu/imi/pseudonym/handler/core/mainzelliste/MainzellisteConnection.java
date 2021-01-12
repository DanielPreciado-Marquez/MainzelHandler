package de.wwu.imi.pseudonym.handler.core.mainzelliste;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.wwu.imi.pseudonym.handler.core.exceptions.MainzellisteConnectionException;

/**
 * Represents a connection to the Mainzelliste. Stores all necessary
 * informations to communicate with the Mainzelliste. Provides Methods for
 * session management of sessions on the Mainzelliste.
 */
public class MainzellisteConnection {

	private static final Logger LOGGER = LoggerFactory.getLogger(MainzellisteConnection.class);

	/**
	 * URL to accept the callback request of the Mainzelliste.
	 */
	private String callbackUrl;

	/**
	 * API key of the Mainzelliste.
	 */
	private String apiKey;

	/**
	 * API version of the Mainzelliste to use.
	 */
	private String apiVersion;

	/**
	 * URL of the Mainzelliste.
	 */
	private String url;

	/**
	 * Whether the callback function of the Mainzelliste should be activated.
	 */
	private boolean useCallback;

	/**
	 * Constructs a new MainzellisteConnection.
	 *
	 * @param callbackUrl            URL to accept the callback request of the
	 *                               Mainzelliste.
	 * @param useCallback            Whether the callback function of the
	 *                               Mainzelliste should be activated.
	 * @param mainzellisteApiKey     API key of the Mainzelliste.
	 * @param mainzellisteApiVersion API version of the Mainzelliste to use.
	 * @param mainzellisteUrl        URL of the Mainzelliste.
	 */
	public MainzellisteConnection(final String callbackUrl, final boolean useCallback, final String mainzellisteApiKey,
			final String mainzellisteApiVersion, final String mainzellisteUrl) {
		this.callbackUrl = callbackUrl;
		this.apiKey = mainzellisteApiKey;
		this.apiVersion = mainzellisteApiVersion;
		this.url = mainzellisteUrl;
		this.useCallback = useCallback;
	}

	/**
	 * @return URL to accept the callback request of the Mainzelliste.
	 */
	public String getCallbackUrl() {
		return callbackUrl;
	}

	/**
	 * @param callbackUrl New URL to accept the callback request of the
	 *                    Mainzelliste.
	 */
	public void setCallbackUrl(String callbackUrl) {
		this.callbackUrl = callbackUrl;
	}

	/**
	 * @return API key of the Mainzelliste.
	 */
	public String getApiKey() {
		return apiKey;
	}

	/**
	 * @param apiKey New API key of the Mainzelliste.
	 */
	public void setApiKey(String apiKey) {
		this.apiKey = apiKey;
	}

	/**
	 * @return API version of the Mainzelliste to use.
	 */
	public String getApiVersion() {
		return apiVersion;
	}

	/**
	 * @param apiVersion New API version of the Mainzelliste to use.
	 */
	public void setApiVersion(String apiVersion) {
		this.apiVersion = apiVersion;
	}

	/**
	 * @return URL of the Mainzelliste.
	 */
	public String getUrl() {
		return url;
	}

	/**
	 * @param url New URL of the Mainzelliste.
	 */
	public void setUrl(String url) {
		this.url = url;
	}

	/**
	 * @return Whether the callback function of the Mainzelliste should be
	 *         activated.
	 */
	public boolean isUseCallback() {
		return useCallback;
	}

	/**
	 * @param useCallback Whether the callback function of the Mainzelliste should
	 *                    be activated.
	 */
	public void setUseCallback(boolean useCallback) {
		this.useCallback = useCallback;
	}

	/**
	 * Creates a new session on the Mainzelliste and returns a corresponding
	 * MaintellisteSession.
	 *
	 * @param httpClient A HTTP-Client for the connection.
	 * @return New MaintellisteSession instance representing the new session.
	 */
	public MainzellisteSession createMainzellisteSession(final HttpClient httpClient) {
		LOGGER.debug("Creating new session");

		final String connectionUrl = url + "/sessions";

		final HttpPost request = new HttpPost(connectionUrl);
		request.addHeader("mainzellisteApiKey", apiKey);
		request.addHeader("mainzellisteApiVersion", apiVersion);

		final JSONObject jsonResponse;

		try {
			final HttpResponse httpResponse = httpClient.execute(request);
			final InputStream connectionResponse = httpResponse.getEntity().getContent();
			final String response = IOUtils.toString(connectionResponse, StandardCharsets.UTF_8);
			jsonResponse = new JSONObject(response);
		} catch (Exception exception) {
			LOGGER.error("Error while connecting to Mainzelliste: " + exception.getLocalizedMessage(), exception);
			throw new MainzellisteConnectionException(exception.getLocalizedMessage(), exception);
		}

		final String sessionId = jsonResponse.getString("sessionId");
		LOGGER.debug("Created Session with sessionId " + sessionId);

		return new MainzellisteSession(this, sessionId);
	}

	/**
	 * Requests the session object from the Mainzelliste of the given session.
	 *
	 * @param httpClient          A HTTP-Client for the connection.
	 * @param mainzellisteSession Corresponding MainzellisteSession of the session
	 *                            on the Mainzelliste to return.
	 * @return JSON representation of the session object.
	 */
	public JSONObject getMainzellisteSession(final HttpClient httpClient,
			final MainzellisteSession mainzellisteSession) {
		LOGGER.debug("Getting Mainzelliste session: " + mainzellisteSession.getSessionId());

		final HttpGet request = new HttpGet(mainzellisteSession.getSessionUrl());
		request.addHeader("accept", "application/json");
		request.addHeader("mainzellisteApiVersion", apiVersion);

		final JSONObject jsonResponse;

		try {
			final HttpResponse httpResponse = httpClient.execute(request);
			final int statusCode = httpResponse.getStatusLine().getStatusCode();

			if (statusCode == 200) {
				final InputStream responseContent = httpResponse.getEntity().getContent();
				final String response = IOUtils.toString(responseContent, StandardCharsets.UTF_8);
				jsonResponse = new JSONObject(response);
			} else {
				jsonResponse = null;
			}
		} catch (Exception exception) {
			LOGGER.error("Error while connecting to Mainzelliste: " + exception.getLocalizedMessage(), exception);
			throw new MainzellisteConnectionException(exception.getLocalizedMessage(), exception);
		}

		return jsonResponse;
	}

	/**
	 * Deletes the corresponding session on the Mainzelliste of the given
	 * MainzellisteSession.
	 *
	 * @param httpClient          A HTTP-Client for the connection.
	 * @param mainzellisteSession Corresponding MainzellisteSession of the session
	 *                            on the Mainzelliste to get deleted.
	 */
	public void deleteMainzellisteSession(final HttpClient httpClient, final MainzellisteSession mainzellisteSession) {
		LOGGER.debug("Deleting Mainzelliste session: " + mainzellisteSession.getSessionId());

		final HttpDelete request = new HttpDelete(mainzellisteSession.getSessionUrl());
		request.addHeader("mainzellisteApiVersion", apiVersion);

		try {
			final HttpResponse httpResponse = httpClient.execute(request);
			final int statusCode = httpResponse.getStatusLine().getStatusCode();

			if (statusCode != 204) {
				LOGGER.error("Error while deleting MainzellisteSession with seesionId "
						+ mainzellisteSession.getSessionId());
				throw new MainzellisteConnectionException("Error while deleting MainzellisteSession with seesionId "
						+ mainzellisteSession.getSessionId());
			}
		} catch (Exception exception) {
			LOGGER.error("Error while connecting to Mainzelliste: " + exception.getLocalizedMessage(), exception);
			throw new MainzellisteConnectionException(exception.getLocalizedMessage(), exception);
		}
	}

}
