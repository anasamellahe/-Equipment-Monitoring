package com.example.equipmentmonitoring.repository;

import com.example.equipmentmonitoring.model.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
}
