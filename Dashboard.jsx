import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// 🔥 Firebase Config (replace with yours)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const COLORS = ["#6366F1", "#22C55E", "#F97316", "#EF4444", "#14B8A6"];

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    const customersRef = ref(db, "customers");

    onValue(customersRef, (snapshot) => {
      const data = snapshot.val() || {};

      let list = [];
      let total = 0;

      Object.keys(data).forEach((key) => {
        const item = { id: key, ...data[key] };
        list.push(item);
        total += item.scans || 0;
      });

      // sort by scans (leaderboard)
      list.sort((a, b) => (b.scans || 0) - (a.scans || 0));

      setCustomers(list);
      setTotalScans(total);
    });
  }, []);

  const topCustomers = customers.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Live Scan Analytics Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-gray-500">Total Customers</h2>
          <p className="text-2xl font-bold">{customers.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-gray-500">Total Scans</h2>
          <p className="text-2xl font-bold text-green-600">{totalScans}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-gray-500">Avg Scans/User</h2>
          <p className="text-2xl font-bold">
            {customers.length ? (totalScans / customers.length).toFixed(2) : 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Bar Chart */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">📈 Scans per Customer</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={customers.slice(0, 10)}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="scans" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">🥧 Scan Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customers.slice(0, 5)}
                dataKey="scans"
                nameKey="name"
                outerRadius={100}
                label
              >
                {customers.slice(0, 5).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4">🏆 Top Customers</h2>

        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Rank</th>
              <th className="p-2">Name</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Scans</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c, i) => (
              <tr key={c.id} className="border-b">
                <td className="p-2 font-bold">#{i + 1}</td>
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.phone}</td>
                <td className="p-2 text-blue-600 font-bold">{c.scans || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
