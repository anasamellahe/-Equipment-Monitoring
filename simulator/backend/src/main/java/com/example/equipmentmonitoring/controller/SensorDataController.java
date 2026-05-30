package com.example.equipmentmonitoring.controller;

import com.example.equipmentmonitoring.model.SensorData;
import com.example.equipmentmonitoring.repository.SensorDataRepository;
import com.example.equipmentmonitoring.service.SensorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensor-data")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SensorDataController {

    private final SensorService sensorService;
    private final SensorDataRepository repository;

    @PostMapping
    public SensorData receiveSensorData(@RequestBody SensorData data) {
        return sensorService.processSensorData(data);
    }

    @GetMapping("/history")
    public List<SensorData> getHistory(@RequestParam(defaultValue = "50") int limit) {
        return repository.findAll(PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "timestamp"))).getContent();
    }
}
