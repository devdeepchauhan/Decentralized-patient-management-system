import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar as CalendarIcon, Users, CheckCircle, LogOut } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DashboardStaff = () => {
    const { user, logout, api } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [form, setForm] = useState({ patientId: '', doctorId: '', date: '', notes: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [appRes, docRes, patRes] = await Promise.all([
                api.get('/appointments'),
                api.get('/auth/doctors'),
                api.get('/auth/patients'),
            ]);
            setAppointments(appRes.data);
            setDoctors(docRes.data);
            setPatients(patRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            await api.post('/appointments', form);
            setForm({ patientId: '', doctorId: '', date: '', notes: '' });
            fetchData();
        } catch (err) {
            alert('Failed to schedule appointment');
        }
    };

    const handleStatus = async (id, status) => {
        try {
            await api.put(`/appointments/${id}/status`, { status });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    // Chart Data Generation
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const apptsPerDay = [0,0,0,0,0,0,0];
    appointments.forEach(a => {
        const d = new Date(a.date).getDay();
        apptsPerDay[d]++;
    });

    const chartData = {
        labels: days,
        datasets: [
            {
                label: 'Appointments',
                data: apptsPerDay,
                backgroundColor: 'rgba(2, 132, 199, 0.5)',
                borderColor: 'rgba(2, 132, 199, 1)',
                borderWidth: 1,
            }
        ]
    };

    return (
        <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 text-white shadow-lg flex flex-col">
            <div className="p-6">
            <h2 className="text-2xl font-bold border-b border-slate-700 pb-4 text-blue-400">Staff Portal</h2>
            </div>
            <div className="flex-1 px-4 space-y-2 mt-4">
               <div className="p-3 bg-slate-700 text-white rounded-lg flex items-center cursor-pointer">
                 <CalendarIcon className="mr-2 w-5 h-5"/> Scheduler
               </div>
               <div className="p-3 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center cursor-pointer">
                 <Users className="mr-2 w-5 h-5"/> Patients List
               </div>
            </div>
            <div className="p-4 border-t border-slate-700">
            <button onClick={logout} className="flex items-center text-red-400 hover:text-red-300">
                <LogOut className="mr-2 w-5 h-5"/> Logout
            </button>
            </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-10 flex flex-col space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Hospital Staff Dashboard</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Schedule Form */}
                <div className="card lg:col-span-1 border-t-4 border-primary">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><CalendarIcon className="mr-2 text-primary"/> Schedule Visit</h2>
                    <form onSubmit={handleSchedule} className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium">Patient</label>
                            <select required value={form.patientId} onChange={e=>setForm({...form, patientId: e.target.value})} className="input-field">
                                <option value="">Select Patient...</option>
                                {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.email})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium">Doctor</label>
                            <select required value={form.doctorId} onChange={e=>setForm({...form, doctorId: e.target.value})} className="input-field">
                                <option value="">Select Doctor...</option>
                                {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium">Date & Time</label>
                            <input required type="datetime-local" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} className="input-field" />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium">Notes</label>
                            <input type="text" value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} className="input-field" placeholder="Reason for visit..."/>
                        </div>
                        <button type="submit" className="w-full btn-primary">Book Appointment</button>
                    </form>
                </div>

                {/* Dashboard Chart & List */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">Weekly Appointments Overview</h2>
                        <div className="h-48 w-full">
                           <Bar data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />
                        </div>
                    </div>

                    <div className="card overflow-hidden p-0">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-slate-800">Recent Appointments</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-sm py-2">
                                        <th className="p-4 border-b">Date</th>
                                        <th className="p-4 border-b">Patient</th>
                                        <th className="p-4 border-b">Doctor</th>
                                        <th className="p-4 border-b">Status</th>
                                        <th className="p-4 border-b">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map(app => (
                                        <tr key={app._id} className="hover:bg-slate-50 border-b last:border-0 text-sm">
                                            <td className="p-4">{new Date(app.date).toLocaleString()}</td>
                                            <td className="p-4 font-medium">{app.patientId?.name}</td>
                                            <td className="p-4">Dr. {app.doctorId?.name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    app.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                    app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="p-4 space-x-2">
                                                {app.status === 'SCHEDULED' && (
                                                    <>
                                                        <button onClick={() => handleStatus(app._id, 'COMPLETED')} className="text-emerald-600 hover:text-emerald-800" title="Mark Completed"><CheckCircle className="w-5 h-5"/></button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {appointments.length === 0 && (
                                        <tr><td colSpan="5" className="p-4 text-center text-slate-500">No appointments scheduled</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default DashboardStaff;
