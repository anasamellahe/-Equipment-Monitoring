# Industrial Equipment Monitoring System

## Overview
The Industrial Equipment Monitoring System is a real-time observability platform designed to track the health and performance of industrial machinery. In high-stakes manufacturing environments, unplanned downtime is costly. This application provides a full-stack solution to ingest high-frequency sensor data, evaluate machine status against safety thresholds, and broadcast live telemetry to a centralized dashboard.

The goal of this MVP is to demonstrate a robust pipeline from data generation (simulated hardware) to real-time visualization, ensuring that engineers can respond to "Warning" or "Critical" states before equipment failure occurs.

## System Architecture

The application is built using a microservices-inspired architecture, containerized with Docker to ensure environment parity across development and production.

### 1. The Simulator (Data Ingestion Layer)
Developed in Python, this service mimics the behavior of physical industrial sensors. It generates randomized but realistic telemetry for:
- Temperature (Celsius)
- Pressure (Bar)
- Vibration (mm/s)
The simulator pushes this data to the backend via a REST API every 1 to 2 seconds, simulating the continuous stream of data expected from a PLC (Programmable Logic Controller).

### 2. The Backend (Processing & Orchestration Layer)
Built with Java 21 and Spring Boot 3.2, the backend serves as the brain of the system.
- **Data Evaluation**: Every incoming packet is evaluated against business logic. If metrics exceed specific bounds (e.g., Temperature > 85C), the system marks the record as "CRITICAL".
- **Persistence**: Data is stored in an SQLite database using Spring Data JPA. This provides a lightweight, file-based relational storage solution that requires zero configuration.
- **Real-time Broadcasting**: Upon saving a record, the backend immediately pushes the data to a WebSocket broker (STOMP). This enables the "push" model where the frontend receives updates without polling.

### 3. The Frontend (Visualization Layer)
The dashboard is a modern React application built with TypeScript and Vite.
- **Live Telemetry**: Uses Recharts to render multi-axis line charts that update in real-time as WebSocket messages arrive.
- **State Management**: Maintains a rolling window of the last 50 data points to provide historical context without causing memory bloat in the browser.
- **Alert Log**: A dedicated section for tracking anomalies, allowing operators to review the sequence of events leading up to a warning or critical state.

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Running the Application
The entire stack is orchestrated via Docker Compose. To start the system, navigate to the project root and execute:

```bash
docker compose up --build -d
```

This command will:
1. Compile the Java source code and build the Spring Boot image.
2. Build the React production assets and serve them via Nginx.
3. Initialize the Python environment for the simulator.
4. Network the containers and expose the necessary ports.

### Accessing the System
Once the containers are healthy, the following endpoints are available:

- **Frontend Dashboard**: [http://localhost:8090](http://localhost:8090)
- **Backend API**: [http://localhost:8082](http://localhost:8082)
- **WebSocket Endpoint**: `ws://localhost:8082/ws`

## Monitoring Thresholds
The system evaluates machine health based on the following engineering specifications:

- **NORMAL**: Default state.
- **WARNING**: Triggered if Temperature exceeds 70°C OR Pressure exceeds 2.5 bar.
- **CRITICAL**: Triggered if Temperature exceeds 85°C OR Vibration exceeds 0.7 mm/s.

## Maintenance and Logs
To monitor the data flow or troubleshoot connectivity between the simulator and the backend, you can follow the container logs:

```bash
# View simulator data generation
docker logs -f monitoring-simulator

# View backend processing and database inserts
docker logs -f monitoring-backend
```

To stop the system and remove the containers:
```bash
docker compose down
```
