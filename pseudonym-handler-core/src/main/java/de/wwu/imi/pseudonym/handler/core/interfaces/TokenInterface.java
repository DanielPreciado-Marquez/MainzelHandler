package de.wwu.imi.pseudonym.handler.core.interfaces;

import java.util.List;

import de.wwu.imi.pseudonym.handler.core.model.DepseudonymizationUrlResponse;
import de.wwu.imi.pseudonym.handler.core.model.PseudonymizationUrlResponse;

public interface TokenInterface {

	PseudonymizationUrlResponse getPseudonymizationUrl(final int amount);

	DepseudonymizationUrlResponse getDepseudonymizationUrl(final List<String> pseudonyms);

}
