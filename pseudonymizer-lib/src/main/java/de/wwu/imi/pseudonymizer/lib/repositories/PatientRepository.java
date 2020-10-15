package de.wwu.imi.pseudonymizer.lib.repositories;

import org.springframework.data.repository.CrudRepository;

import de.wwu.imi.pseudonymizer.lib.entities.Patient;

public interface PatientRepository extends CrudRepository<Patient, String> {

}
