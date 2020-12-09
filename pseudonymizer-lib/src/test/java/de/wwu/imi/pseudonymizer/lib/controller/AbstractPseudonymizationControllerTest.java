package de.wwu.imi.pseudonymizer.lib.controller;

import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.util.ReflectionTestUtils;

import de.wwu.imi.pseudonymizer.lib.model.DepseudonymizationUrlResponse;
import de.wwu.imi.pseudonymizer.lib.model.PseudonymizationUrlResponse;

@ExtendWith(SpringExtension.class)
class AbstractPseudonymizationControllerTest {

	private static AbstractPseudonymizationController controller = Mockito
			.mock(AbstractPseudonymizationController.class, Mockito.CALLS_REAL_METHODS);

	private static final String mainzellisteUrl = "http://localhost:8080/";
	private static final String mainzellisteApiKey = "123BachelorArbeit321";
	private static final String mainzellisteApiVersion = "3.0";
	private static final boolean useCallback = false;

	@BeforeAll
	public static void setUp() {
		ReflectionTestUtils.setField(controller, "mainzellisteUrl", mainzellisteUrl);
		ReflectionTestUtils.setField(controller, "mainzellisteApiKey", mainzellisteApiKey);
		ReflectionTestUtils.setField(controller, "mainzellisteApiVersion", mainzellisteApiVersion);
		ReflectionTestUtils.setField(controller, "useCallback", useCallback);
	}

	@Test
	void getAddPatientTokenTest() {
		final int urlLength = mainzellisteUrl.length();

		final PseudonymizationUrlResponse response = controller.getPseudonymizationUrl(1);
		
		final String[] result = response.getUrlTokens();
		assertEquals(1, result.length);

		final String tokenUrl = result[0];
		assertEquals(53 + urlLength, tokenUrl.length());

		final String[] tokenUrlParts = tokenUrl.split("=");
		assertEquals(mainzellisteUrl + "patients?tokenId", tokenUrlParts[0]);
		assertEquals(5, tokenUrlParts[1].split("-").length);
	}

	/**
	 * 5 min
	 */
	@Test
	void get10000AddPatientTokensTest() {
		final int urlLength = mainzellisteUrl.length();

		final PseudonymizationUrlResponse response = controller.getPseudonymizationUrl(10000);
		final String[] result = response.getUrlTokens();
		assertEquals(10000, result.length);

		for (final String tokenUrl : result) {
			assertEquals(53 + urlLength, tokenUrl.length());
			assertEquals(mainzellisteUrl + "patients?tokenId", tokenUrl.split("=")[0]);
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

		final DepseudonymizationUrlResponse resopnse = controller.getDepseudonymizationUrl(pseudonyms);
		final String tokenUrl = resopnse.getUrl();
		final List<String> invalidPseudonyms = resopnse.getInvalidPseudonyms();

		assertEquals(53 + urlLength, tokenUrl.length(), "Length of the URL is wrong");
		assertEquals(mainzellisteUrl + "patients?tokenId", tokenUrl.split("=")[0]);

		assertEquals(2, invalidPseudonyms.size());
		assertTrue(invalidPseudonyms.contains(pseudonym0));
		assertTrue(invalidPseudonyms.contains(pseudonym2));
	}

	@Test
	void getReadPatientsTokenTestException() {
		final List<String> pseudonyms = new ArrayList<String>();

		final String pseudonym = "";

		pseudonyms.add(pseudonym);

		final DepseudonymizationUrlResponse resopnse = controller.getDepseudonymizationUrl(pseudonyms);
		final String url = resopnse.getUrl();
		final List<String> invalidPseudonyms = resopnse.getInvalidPseudonyms();

		assertEquals("", url, "URL should be empty if all patients are invalid!");

		assertEquals(1, invalidPseudonyms.size());
		assertTrue(invalidPseudonyms.contains(pseudonym));
	}

}
