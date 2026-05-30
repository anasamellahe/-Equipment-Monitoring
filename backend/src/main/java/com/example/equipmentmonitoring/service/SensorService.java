package com.example.equipmentmonitoring.service;

import com.example.equipmentmonitoring.model.SensorData;
import com.example.equipmentmonitoring.repository.SensorDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SensorService {

    private final SensorDataRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

    public SensorData processSensorData(SensorData data) {
        if (data.getTimestamp() == null) {
            data.setTimestamp(LocalDateTime.now());
        }

        String status = evaluateStatus(data);
        data.setStatus(status);

        SensorData savedData = repository.save(data);
        
        // Broadcast to WebSockets
        messagingTemplate.convertAndSend("/topic/sensor", savedData);
        
        return savedData;
    }

    private String evaluateStatus(SensorData data) {
        if (data.getTemperature() > 85 || data.getVibration() > 0.7) {
            return "CRITICAL";
        } else if (data.getTemperature() > 70 || data.getPressure() > 2.5) {
            return "WARNING";
        } else {
            return "NORMAL";
        }
    }
}
