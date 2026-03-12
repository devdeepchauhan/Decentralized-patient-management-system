import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Web3Context } from '../context/Web3Context';
import { Clock, Download, HeartPulse, LogOut, FileText } from 'lucide-react';

const DashboardPatient = () => {
    const { user, logout, api } = useContext(AuthContext);
    const { account, connectWallet, getPatientRecords, getRecord } = useContext(Web3Context);
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [doctorsMap, setDoctorsMap] = useState({});
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportData, setReportData] = useState(null);

    // MOCK IPFS FETCH: Watch for selectedReport changes and load from backend DB
    useEffect(() => {
        const fetchMockIPFS = async () => {
             if (!selectedReport) {
                 setReportData(null);
                 return;
             }
             try {
                 const res = await api.get(`/ipfs/${selectedReport}`);
                 if (res.data && res.data.data) {
                     setReportData(JSON.parse(res.data.data));
                 }
             } catch(e) {
                 setReportData({ error: 'Failed to decrypt or parse IPFS document' });
             }
        };
        fetchMockIPFS();
    }, [selectedReport, api]);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await api.get('/auth/doctors');
                const dMap = {};
                res.data.forEach(d => {
                    if (d.walletAddress) {
                        dMap[d.walletAddress.toLowerCase()] = d.name;
                    }
                });
                setDoctorsMap(dMap);
            } catch (err) {
                console.error("Could not fetch doctors list", err);
            }
        };
        fetchDoctors();
    }, [api]);

    useEffect(() => {
        const fetchRecords = async () => {
            if(!account) return;
            setLoading(true);
            try {
                // Warning: user.walletAddress should match account
                const hashes = await getPatientRecords(account);
                
                // Fetch full details for each hash
                const detailedRecords = [];
                for(let h of hashes) {
                    const rec = await getRecord(h);
                    detailedRecords.push({
                        recordHash: rec[0],
                        doctorWallet: rec[2],
                        timestamp: new Date(Number(rec[3]) * 1000).toLocaleString(),
                        ipfsHash: rec[4]
                    });
                }
                
                // Sort by timestamp descending
                detailedRecords.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                setRecords(detailedRecords);
            } catch(e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, [account]);

    return (
        <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 text-white shadow-lg flex flex-col">
            <div className="p-6">
            <h2 className="text-2xl font-bold border-b border-slate-700 pb-4 text-emerald-400">Patient Portal</h2>
            </div>
            <div className="flex-1 px-4 space-y-2 mt-4">
                <div className="p-3 bg-slate-800 rounded-lg flex flex-col items-start text-sm">
                    <span className="text-slate-400 mb-1">Your Unique Hash ID:</span>
                    <span className="font-mono text-emerald-300 break-all">{user.hashId}</span>
                </div>
                <div className="mt-8">
                    <button onClick={connectWallet} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg font-medium transition">
                        {account ? 'Wallet Connected' : 'Connect Wallet'}
                    </button>
                    {account && <p className="text-xs text-slate-400 mt-2 truncate text-center">{account}</p>}
                </div>
            </div>
            <div className="p-4 border-t border-slate-700">
            <button onClick={logout} className="flex items-center text-red-400 hover:text-red-300">
                <LogOut className="mr-2 w-5 h-5"/> Logout
            </button>
            </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-10">
            <div className="flex items-center mb-8">
                <div className="bg-emerald-100 p-3 rounded-full mr-4">
                    <HeartPulse className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                   <h1 className="text-3xl font-bold text-slate-800">Hello, {user.name}</h1>
                   <p className="text-slate-500">View your immutable medical history logged on the blockchain.</p>
                </div>
                <div className="ml-auto">
                   <button onClick={() => window.print()} className="btn-primary flex items-center bg-emerald-600 hover:bg-emerald-700">
                      <Download className="mr-2 w-5 h-5" /> Export PDF
                   </button>
                </div>
            </div>
            
            <div className="card">
                <h2 className="text-xl font-bold mb-6 flex items-center border-b pb-4"><Clock className="mr-2 text-slate-400"/> Medical Timeline</h2>
                
                {!account && (
                    <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed">
                        <p className="text-slate-500">Please connect your MetaMask wallet containing your patient address to decrypt records.</p>
                    </div>
                )}
                {account && loading && <p className="text-center p-8 text-slate-500 animate-pulse">Querying blockchain...</p>}
                
                {account && !loading && records.length === 0 && (
                    <div className="text-center p-8 text-slate-500">No medical records found on the blockchain for your wallet.</div>
                )}

                {account && !loading && records.length > 0 && (
                     <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {records.map((rec, idx) => (
                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Timeline Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 group-[.is-active]:bg-emerald-500 text-white group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    <FileText className="w-4 h-4" />
                                </div>
                                {/* Card */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="font-bold text-slate-800 text-sm">Consultation</div>
                                        <time className="font-mono text-xs text-emerald-600">{rec.timestamp}</time>
                                    </div>
                                    <div className="text-slate-500 text-xs mb-3 truncate" title={rec.recordHash}>Record ID: {rec.recordHash}</div>
                                    <div className="text-slate-500 text-xs mb-3 truncate">
                                        Dr: {doctorsMap[rec.doctorWallet.toLowerCase()] ? `Dr. ${doctorsMap[rec.doctorWallet.toLowerCase()]}` : rec.doctorWallet}
                                    </div>
                                    <button 
                                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-3 rounded flex items-center transition"
                                        onClick={() => setSelectedReport(rec.ipfsHash)}
                                    >
                                        <Download className="w-3 h-3 mr-1" /> View IPFS Report
                                    </button>
                                </div>
                            </div>
                        ))}
                     </div>
                )}
            </div>
        </div>

        {/* IPFS Report Modal */}
        {selectedReport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 border-b pb-2">Decrypted IPFS Document</h3>
                    <div className="py-4">
                        <div className="bg-slate-100 p-3 rounded font-mono text-xs text-slate-600 mb-4 break-words">
                            IPFS Hash (CID): {selectedReport}
                        </div>

                        
                        <div className="mt-6 border border-emerald-200 bg-emerald-50 rounded bg-white">
                            <div className="bg-emerald-100 px-4 py-2 border-b border-emerald-200 font-bold text-emerald-800">
                                Decrypted Medical Record
                            </div>
                            <div className="p-4 space-y-4">
                                {reportData ? (
                                    <>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Diagnosis</h4>
                                            <p className="text-slate-800 whitespace-pre-wrap">{reportData.diagnosis}</p>
                                        </div>
                                        <div className="border-t pt-4">
                                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Prescription / Notes</h4>
                                            <p className="text-slate-800 whitespace-pre-wrap">{reportData.prescription}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-6 text-slate-400">
                                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p>Mock IPFS data not found on the database provider for this CID.</p>
                                        <p className="text-xs mt-1">Note: This happens if the record was created before the backend mock uploader was implemented.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button 
                            onClick={() => setSelectedReport(null)}
                            className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 transition"
                        >
                            Close Document
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
};

export default DashboardPatient;
