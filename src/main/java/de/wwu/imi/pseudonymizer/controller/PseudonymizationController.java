package de.wwu.imi.pseudonymizer.controller;

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
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Controller that can talk to the Mainzelliste service.
 * Its main purpose is to get a URL from the Mainzelliste that contains session and query tokens and is ready to be used
 * to pseudonymize a patient.
 *
 * That way the pii (personally identifiable information) doesn't have to be sent to this controller and instead
 * the client can do the pseudonymization themselves by sending the pii to the mainzelliste URL mentioned above.
 *
 * @see <a href="https://bitbucket.org/medicalinformatics/mainzelliste/src/master/">Mainzelliste Source Code</a>
 */
@RestController
@CrossOrigin
public class PseudonymizationController {

    private static final Logger LOGGER = org.slf4j.LoggerFactory.getLogger(PseudonymizationController.class);

    // mainzelliste configurations are loaded from application.properties
    @Value("${mainzelliste.url}")
    private String mainzellisteUrl;
    @Value("${mainzelliste.apikey}")
    private String mainzellisteApiKey;

    /**
     * Handles the tokening with the pseudonymization server and returns the url
     * with the appropriate token to get a pseudonym.
     *
     * @return The url with the appropriate token to get a pseudonym from the
     * pseudonymization service.
     */
    @RequestMapping(value = "/pseudonymization/pseudonym", method = RequestMethod.GET)
    public String getPseudonymizationURL() {
        HttpClient httpClient = HttpClientBuilder.create().build();
        String sessionURL = getSessionURL(httpClient);
        String tokenId = getTokenId(sessionURL, httpClient);
        return mainzellisteUrl + "patients?tokenId=" + tokenId;
    }

    /**
     * Gets a session url with a valid session token from the pseudonymization
     * server with configured baseURL.
     *
     * @param httpClient A HTTP-Client for the connection.
     * @return The session url with a valid session token from the
     * pseudonymization server.
     */
    private String getSessionURL(HttpClient httpClient) {
        String connectionUrl = mainzellisteUrl + "sessions/";
        HttpPost request = new HttpPost(connectionUrl);
        request.addHeader("mainzellisteApiKey", mainzellisteApiKey);
        try {
            HttpResponse httpResponse = httpClient.execute(request);
            InputStream connectionResponse = httpResponse.getEntity().getContent();
            String response = IOUtils.toString(connectionResponse, StandardCharsets.UTF_8);
            JSONObject jsonResponse = new JSONObject(response);
            return jsonResponse.getString("uri");

        } catch (IOException exception) {
            LOGGER.debug("Error while connecting to the pseudonymization server: {}", exception.getLocalizedMessage());
        }
        return "";
    }

    /**
     * Gets a query token which allows to add a new patient from the
     * pseudonymization server with given sessionURL.
     *
     * @param sessionUrl A session url with a valid session token from the
     * pseudonymization server.
     * @param httpClient A HTTP-Client for the connection.
     * @return The query token from the pseudonymization server.
     */
    private String getTokenId(String sessionUrl, HttpClient httpClient) {
        String connectionUrl = sessionUrl + "tokens/";
        HttpPost request = new HttpPost(connectionUrl);
        request.addHeader("content-type", "application/json");
        request.addHeader("mainzellisteApiKey", mainzellisteApiKey);
        JSONObject type = new JSONObject();
        JSONObject callback = new JSONObject();
        type.put("data", callback);
        type.put("type", "addPatient");
        request.setEntity(new StringEntity(type.toString(), ContentType.APPLICATION_JSON));
        try {
            HttpResponse httpResponse = httpClient.execute(request);
            InputStream connectionResponse = httpResponse.getEntity().getContent();
            String response = IOUtils.toString(connectionResponse, StandardCharsets.UTF_8);
            JSONObject jsonResponse = new JSONObject(response);
            return jsonResponse.getString("tokenId");
        } catch (IOException exception) {
            LOGGER.debug("Error while connecting to the pseudonymization server: {}", exception.getLocalizedMessage());
        }
        return "";
    }

}
