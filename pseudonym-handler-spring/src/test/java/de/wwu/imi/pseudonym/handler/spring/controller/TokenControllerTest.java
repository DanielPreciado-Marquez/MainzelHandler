package de.wwu.imi.pseudonym.handler.spring.controller;

import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import de.wwu.imi.pseudonym.handler.core.model.DepseudonymizationUrlRequest;
import de.wwu.imi.pseudonym.handler.core.model.DepseudonymizationUrlResponse;
import de.wwu.imi.pseudonym.handler.core.model.PseudonymizationUrlRequest;
import de.wwu.imi.pseudonym.handler.core.model.PseudonymizationUrlResponse;
import de.wwu.imi.pseudonym.handler.spring.PseudonymHandlerConfig;

@ExtendWith(SpringExtension.class)
@SpringBootTest(classes=PseudonymHandlerConfig.class)
class TokenControllerTest {

	@Value("${pseudonym-handler.mainzelliste.url}")
	private String mainzellisteUrl;

	@Autowired
	private TokenController tokenController;

	@Test
	void getAddPatientTokenTest() {
		final int urlLength = mainzellisteUrl.length();

		final PseudonymizationUrlResponse response = tokenController.getPseudonymizationUrl(new PseudonymizationUrlRequest(1));

		final String[] result = response.getUrlTokens();
		assertEquals(1, result.length);

		final String tokenUrl = result[0];
		System.out.println(tokenUrl);
		assertEquals(54 + urlLength, tokenUrl.length());

		final String[] tokenUrlParts = tokenUrl.split("=");
		assertEquals(mainzellisteUrl + "/patients?tokenId", tokenUrlParts[0]);
		assertEquals(5, tokenUrlParts[1].split("-").length);
	}

	/**
	 * 5 min
	 */
	@Test
	void get10000AddPatientTokensTest() {
		final int urlLength = mainzellisteUrl.length();

		final PseudonymizationUrlResponse response = tokenController.getPseudonymizationUrl(new PseudonymizationUrlRequest(10000));
		final String[] result = response.getUrlTokens();
		assertEquals(10000, result.length);

		for (final String tokenUrl : result) {
			assertEquals(54 + urlLength, tokenUrl.length());
			assertEquals(mainzellisteUrl + "/patients?tokenId", tokenUrl.split("=")[0]);
		}
	}

	@Test
	void getReadPatientsTokenTest() {
		final int urlLength = mainzellisteUrl.length();
		final List<String> pseudonyms = new ArrayList<String>();

		final String pseudonym0 = "Hello!";
		final String pseudonym1 = "0007W0W9";
		final String pseudonym2 = "";

		pseudonyms.add(pseudonym0);
		pseudonyms.add(pseudonym1);
		pseudonyms.add(pseudonym2);
		
		final List<String> resultFields = new ArrayList<String>();
		resultFields.add("vorname");

		final DepseudonymizationUrlResponse resopnse = tokenController.getDepseudonymizationUrl(new DepseudonymizationUrlRequest(pseudonyms, resultFields));
		final String tokenUrl = resopnse.getUrl();
		final List<String> invalidPseudonyms = resopnse.getInvalidPseudonyms();

		assertEquals(54 + urlLength, tokenUrl.length(), "Length of the URL is wrong");
		assertEquals(mainzellisteUrl + "/patients?tokenId", tokenUrl.split("=")[0]);

		assertEquals(2, invalidPseudonyms.size());
		assertTrue(invalidPseudonyms.contains(pseudonym0));
		assertTrue(invalidPseudonyms.contains(pseudonym2));
	}

	@Test
	void getReadPatientsTokenTestException() {
		final List<String> pseudonyms = new ArrayList<String>();

		final String pseudonym = "";
		pseudonyms.add(pseudonym);
		
		final List<String> resultFields = new ArrayList<String>();
		resultFields.add("vorname");

		final DepseudonymizationUrlResponse resopnse = tokenController.getDepseudonymizationUrl(new DepseudonymizationUrlRequest(pseudonyms, resultFields));
		final String url = resopnse.getUrl();
		final List<String> invalidPseudonyms = resopnse.getInvalidPseudonyms();

		assertEquals("", url, "URL should be empty if all patients are invalid!");

		assertEquals(1, invalidPseudonyms.size());
		assertTrue(invalidPseudonyms.contains(pseudonym));
	}

}
