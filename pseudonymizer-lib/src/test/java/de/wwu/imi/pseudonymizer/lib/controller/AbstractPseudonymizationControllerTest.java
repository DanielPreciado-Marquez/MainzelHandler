package de.wwu.imi.pseudonymizer.lib.controller;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(SpringExtension.class)
class AbstractPseudonymizationControllerTest {

	private static AbstractPseudonymizationController controller = Mockito
			.mock(AbstractPseudonymizationController.class, Mockito.CALLS_REAL_METHODS);

	@BeforeAll
	public static void setUp() {
		ReflectionTestUtils.setField(controller, "mainzellisteUrl",
				"https://zbb-mfm-dev.uni-muenster.de/mainzelliste/");
		ReflectionTestUtils.setField(controller, "mainzellisteApiKey", "123BachelorArbeit321");
	}

	@Test
	void GetAddPatientTokenTest() {
		final String[] result = controller.getPseudonymizationURL("1");

		assertEquals(1, result.length);
		assertEquals(102, result[0].length());
		assertEquals("https://zbb-mfm-dev.uni-muenster.de/mainzelliste/patients?tokenId=", result[0].substring(0, 66));

		final var token = result[0].substring(66, 102);
		final var parts = token.split("-");
		assertEquals(5, parts.length);
	}

	/**
	 * 5 min
	 */
	@Test
	void Get10000AddPatientTokensTest() {
		final String[] result = controller.getPseudonymizationURL("10000");
		assertEquals(10000, result.length);

		for (final var token : result) {
			assertEquals(102, token.length());
			assertEquals("https://zbb-mfm-dev.uni-muenster.de/mainzelliste/patients?tokenId=", token.substring(0, 66));
		}
	}

}
