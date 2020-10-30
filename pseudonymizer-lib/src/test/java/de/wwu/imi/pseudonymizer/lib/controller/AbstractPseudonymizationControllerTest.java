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

import de.wwu.imi.pseudonymizer.lib.model.DepseudonymizationResponse;

@ExtendWith(SpringExtension.class)
class AbstractPseudonymizationControllerTest {

	private static AbstractPseudonymizationController controller = Mockito
			.mock(AbstractPseudonymizationController.class, Mockito.CALLS_REAL_METHODS);

	private static final String mainzellisteUrl = "https://zbb-mfm-dev.uni-muenster.de/mainzelliste/";
	private static final String mainzellisteApiKey = "123BachelorArbeit321";

	@BeforeAll
	public static void setUp() {
		ReflectionTestUtils.setField(controller, "mainzellisteUrl", mainzellisteUrl);
		ReflectionTestUtils.setField(controller, "mainzellisteApiKey", mainzellisteApiKey);
	}

	@Test
	void getAddPatientTokenTest() {
		final String[] result = controller.getPseudonymizationURL("1");

		assertEquals(1, result.length);
		assertEquals(102, result[0].length());
		assertEquals(mainzellisteUrl + "patients?tokenId=", result[0].substring(0, 66));

		final var token = result[0].substring(66, 102);
		final var parts = token.split("-");
		assertEquals(5, parts.length);
	}

	/**
	 * 5 min
	 */
	@Test
	void get10000AddPatientTokensTest() {
		final String[] result = controller.getPseudonymizationURL("10000");
		assertEquals(10000, result.length);

		for (final var token : result) {
			assertEquals(102, token.length());
			assertEquals(mainzellisteUrl + "patients?tokenId=", token.substring(0, 66));
		}
	}

	@Test
	void getReadPatientsTokenTest() {
		final List<String> pseudonyms = new ArrayList<String>();

		final String pseudonym0 = "Hello!";
		final String pseudonym1 = "H0N587RL";
		final String pseudonym2 = "";

		pseudonyms.add(pseudonym0);
		pseudonyms.add(pseudonym1);
		pseudonyms.add(pseudonym2);

		final DepseudonymizationResponse resopnse = controller.getDepseudonymizationURL(pseudonyms);
		final String url = resopnse.getUrl();
		final List<String> invalidPseudonyms = resopnse.getInvalidPseudonyms();

		assertEquals(102, url.length(), "Length of the URL is wrong");
		assertEquals(mainzellisteUrl + "patients?tokenId=", url.substring(0, 66));

		assertEquals(2, invalidPseudonyms.size());
		assertTrue(invalidPseudonyms.contains(pseudonym0));
		assertTrue(invalidPseudonyms.contains(pseudonym2));
	}

	@Test
	void getReadPatientsTokenTestException() {
		final List<String> pseudonyms = new ArrayList<String>();

		final String pseudonym = "";

		pseudonyms.add(pseudonym);

		final DepseudonymizationResponse resopnse = controller.getDepseudonymizationURL(pseudonyms);
		final String url = resopnse.getUrl();
		final List<String> invalidPseudonyms = resopnse.getInvalidPseudonyms();

		assertEquals("", url, "URL should be empty if all patients are invalid!");

		assertEquals(1, invalidPseudonyms.size());
		assertTrue(invalidPseudonyms.contains(pseudonym));
	}

}
