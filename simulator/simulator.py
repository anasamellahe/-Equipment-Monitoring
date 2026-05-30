import requests
import time
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

BACKEND_URL = "http://backend:8080/api/sensor-data"

def generate_sensor_data():
    return {
        "temperature": round(random.uniform(50.0, 95.0), 2),
        "pressure": round(random.uniform(1.0, 3.0), 2),
        "vibration": round(random.uniform(0.1, 1.0), 2)
    }

def main():
    logging.info("Starting Industrial Equipment Simulator...")
    
    while True:
        try:
            data = generate_sensor_data()
            logging.info(f"Sending data: {data}")
            
            response = requests.post(BACKEND_URL, json=data, timeout=5)
            
            if response.status_code == 200:
                logging.info(f"Successfully sent data. Status: {response.json().get('status')}")
            else:
                logging.error(f"Failed to send data. Status code: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            logging.error(f"Error connecting to backend: {e}")
        
        # Wait 1-2 seconds
        time.sleep(random.uniform(1.0, 2.0))

if __name__ == "__main__":
    main()
