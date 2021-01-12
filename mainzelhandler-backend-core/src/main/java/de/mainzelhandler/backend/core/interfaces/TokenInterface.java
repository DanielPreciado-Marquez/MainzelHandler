package de.mainzelhandler.backend.core.interfaces;

import de.mainzelhandler.backend.core.model.DepseudonymizationUrlRequest;
import de.mainzelhandler.backend.core.model.DepseudonymizationUrlResponse;
import de.mainzelhandler.backend.core.model.PseudonymizationUrlRequest;
import de.mainzelhandler.backend.core.model.PseudonymizationUrlResponse;

/**
 * Interface for the token resource.
 */
public interface TokenInterface {

	/**
	 * REST interface for addPatient token. Takes the number of requested tokens and
	 * returns the requested number of URLs and a boolean, whether the callback
	 * function is enabled. Each URL contains its own unique token.
	 *
	 * @param request Details of the request.
	 * @return Response of the request.
	 */
	PseudonymizationUrlResponse getPseudonymizationUrl(final PseudonymizationUrlRequest request);

	/**
	 * REST interface for readPatients token. Takes the id's of the patients to
	 * depseudonymize and the field names of the PII to be returned by the
	 * depseudonymization. Id's are either pseudonyms or tokens used for the
	 * pseudonymization.
	 *
	 * @param request Details of the request.
	 * @return Response of the request.
	 */
	DepseudonymizationUrlResponse getDepseudonymizationUrl(final DepseudonymizationUrlRequest request);

}
