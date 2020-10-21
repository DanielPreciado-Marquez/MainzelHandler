package de.wwu.imi.demonstrator.app.repositories;

import org.springframework.data.repository.CrudRepository;

import de.wwu.imi.demonstrator.app.entities.PatientEntity;

public interface PatientRepository extends CrudRepository<PatientEntity, String> {

}
