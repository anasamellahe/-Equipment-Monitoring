import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AlertTriangle, CheckCircle, AlertCircle, Activity, Thermometer, Gauge } from 'lucide-react';

// Polyfill global for SockJS if needed
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

interface SensorData {
  id: number;
  timestamp: string;
  temperature: number;
  pressure: number;
  vibration: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

const WS_URL = 'http://localhost:8082/ws';

function App() {
  const [dataHistory, setDataHistory] = useState<SensorData[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'NORMAL' | 'WARNING' | 'CRITICAL'>('NORMAL');
  const [alerts, setAlerts] = useState<SensorData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    console.log("Connecting to WebSocket...");
    const socket = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Connected to STOMP");
        setIsConnected(true);
        client.subscribe('/topic/sensor', (message) => {
          const newData: SensorData = JSON.parse(message.body);
          
          setDataHistory((prev) => {
            const updated = [...prev, newData];
            return updated.length > 50 ? updated.slice(updated.length - 50) : updated;
          });

          setCurrentStatus(newData.status);

          if (newData.status !== 'NORMAL') {
            setAlerts((prev) => [newData, ...prev].slice(0, 10));
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
      },
      onDisconnect: () => {
        console.log("Disconnected from STOMP");
        setIsConnected(false);
      }
    });

    client.activate();
    stompClient.current = client;

    // Fetch initial history
    fetch('http://localhost:8082/api/sensor-data/history')
      .then(res => res.json())
      .then(data => {
        const sortedData = [...data].reverse();
        setDataHistory(sortedData);
        if (sortedData.length > 0) {
          setCurrentStatus(sortedData[sortedData.length - 1].status);
        }
      })
      .catch(err => console.error('Failed to fetch history', err));

    return () => {
      client.deactivate();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'bg-red-600';
      case 'WARNING': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CRITICAL': return <AlertCircle className="w-8 h-8 text-white" />;
      case 'WARNING': return <AlertTriangle className="w-8 h-8 text-white" />;
      default: return <CheckCircle className="w-8 h-8 text-white" />;
    }
  };

  const lastData = dataHistory.length > 0 ? dataHistory[dataHistory.length - 1] : null;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Industrial Equipment Monitor</h1>
        <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-white ${getStatusColor(currentStatus)}`}>
          {getStatusIcon(currentStatus)}
          <span className="mt-2 text-xl font-bold tracking-wider">{currentStatus}</span>
          <span className="text-sm opacity-80 uppercase">System Status</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Thermometer className="w-5 h-5" />
            <span className="text-sm font-medium uppercase">Temperature</span>
          </div>
          <span className="text-3xl font-bold text-gray-800">{lastData?.temperature.toFixed(1) || '--'} °C</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Gauge className="w-5 h-5" />
            <span className="text-sm font-medium uppercase">Pressure</span>
          </div>
          <span className="text-3xl font-bold text-gray-800">{lastData?.pressure.toFixed(2) || '--'} bar</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium uppercase">Vibration</span>
          </div>
          <span className="text-3xl font-bold text-gray-800">{lastData?.vibration.toFixed(2) || '--'} mm/s</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
          <h2 className="text-lg font-bold mb-4 text-gray-700">Real-time Metrics</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="timestamp" 
                tick={{fontSize: 10}} 
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip 
                labelFormatter={(ts) => new Date(ts).toLocaleString()}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line yAxisId="left" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#ef4444" strokeWidth={2} dot={false} animationDuration={300} />
              <Line yAxisId="left" type="monotone" dataKey="pressure" name="Pressure (bar)" stroke="#3b82f6" strokeWidth={2} dot={false} animationDuration={300} />
              <Line yAxisId="right" type="monotone" dataKey="vibration" name="Vibration (mm/s)" stroke="#10b981" strokeWidth={2} dot={false} animationDuration={300} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Alerts Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-700">Recent Alerts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-400 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Temp</th>
                <th className="px-6 py-3">Pressure</th>
                <th className="px-6 py-3">Vibration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400 italic">No recent alerts</td>
                </tr>
              ) : (
                alerts.map((alert, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(alert.timestamp).toLocaleTimeString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold text-white ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{alert.temperature.toFixed(1)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{alert.pressure.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{alert.vibration.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
