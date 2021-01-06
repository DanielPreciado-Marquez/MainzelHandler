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

public class MainzellisteConnection {

	private static final Logger LOGGER = LoggerFactory.getLogger(MainzellisteConnection.class);

	private String callbackUrl;
	private String apiKey;
	private String apiVersion;
	private String url;
	private boolean useCallback;

	public MainzellisteConnection(final String callbackUrl, final boolean useCallback, final String mainzellisteApiKey,
			final String mainzellisteApiVersion, final String mainzellisteUrl) {
		this.callbackUrl = callbackUrl;
		this.apiKey = mainzellisteApiKey;
		this.apiVersion = mainzellisteApiVersion;
		this.url = mainzellisteUrl;
		this.useCallback = useCallback;
	}

	public String getCallbackUrl() {
		return callbackUrl;
	}

	public void setCallbackUrl(String callbackUrl) {
		this.callbackUrl = callbackUrl;
	}

	public String getApiKey() {
		return apiKey;
	}

	public void setApiKey(String apiKey) {
		this.apiKey = apiKey;
	}

	public String getApiVersion() {
		return apiVersion;
	}

	public void setApiVersion(String apiVersion) {
		this.apiVersion = apiVersion;
	}

	public String getUrl() {
		return url;
	}

	public void setMainzellisteUrl(String url) {
		this.url = url;
	}

	public boolean isUseCallback() {
		return useCallback;
	}

	public void setUseCallback(boolean useCallback) {
		this.useCallback = useCallback;
	}

	/**
	 * Gets a session url with a valid session token from the Mainzelliste with
	 * configured baseURL.
	 *
	 * @param httpClient A HTTP-Client for the connection.
	 * @return The session url with a valid session token from the Mainzelliste.
	 */
	public MainzellisteSession createMainzellisteSession(final HttpClient httpClient) {
		LOGGER.debug("Requesting new session url");

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

		final String uri = url + "/sessions/" + jsonResponse.getString("sessionId");
		LOGGER.debug("Session url: " + uri);
		LOGGER.debug("Mainzelliste url: " + uri);
		return new MainzellisteSession(this, sessionId);
	}

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
