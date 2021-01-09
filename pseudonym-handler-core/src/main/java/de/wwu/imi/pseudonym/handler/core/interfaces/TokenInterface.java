package de.wwu.imi.pseudonym.handler.core.interfaces;

import de.wwu.imi.pseudonym.handler.core.model.DepseudonymizationUrlRequest;
import de.wwu.imi.pseudonym.handler.core.model.DepseudonymizationUrlResponse;
import de.wwu.imi.pseudonym.handler.core.model.PseudonymizationUrlRequest;
import de.wwu.imi.pseudonym.handler.core.model.PseudonymizationUrlResponse;

public interface TokenInterface {

	PseudonymizationUrlResponse getPseudonymizationUrl(final PseudonymizationUrlRequest request);

	DepseudonymizationUrlResponse getDepseudonymizationUrl(final DepseudonymizationUrlRequest request);

}
