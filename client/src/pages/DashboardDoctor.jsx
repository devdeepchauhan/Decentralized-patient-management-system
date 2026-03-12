import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Web3Context } from '../context/Web3Context';
import { FileText, Search, PlusCircle, LogOut, Clock, Download } from 'lucide-react';

// Very rough mock of Pinata/IPFS upload for local demonstration, now using local backend DB
const uploadToMockIPFS = async (api, textData) => {
    // Simulate IPFS hash via random string (CID)
    const cid = "Qm" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // MOCK IPFS SAVE: Send payload to our backend DB instead of actual IPFS
    if(textData) {
        await api.post('/ipfs/upload', { cid, data: textData });
    }
    
    return cid;
};

const DashboardDoctor = () => {
  const { user, logout, api } = useContext(AuthContext);
  const { account, connectWallet, addMedicalRecord, getPatientRecords, getRecord, verifyDoctorRole, authorizeDoctor } = useContext(Web3Context);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if(account) {
        try {
           const status = await verifyDoctorRole(account);
           setIsAuthorized(status);
        } catch(e) { console.error(e); }
      }
    };
    checkAuth();
  }, [account, verifyDoctorRole]);

  const handleAuthorize = async () => {
      try {
          setUploading(true);
          await authorizeDoctor(account);
          setIsAuthorized(true);
          alert("Successfully authorized your wallet on the Smart Contract!");
      } catch (err) {
          alert("Authorization failed.");
      } finally {
          setUploading(false);
      }
  };
  
  const [searchHash, setSearchHash] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [recordInfo, setRecordInfo] = useState(null);
  
  const [form, setForm] = useState({ patientWallet: '', patientHashId: '', diagnosis: '', prescription: '' });
  const [uploading, setUploading] = useState(false);

  // Tracking functionality
  const [activeTab, setActiveTab] = useState('add');
  const [trackPatientHash, setTrackPatientHash] = useState('');
  const [tracking, setTracking] = useState(false);
  const [trackedPatientData, setTrackedPatientData] = useState(null);

  // View records functionality
  const [patientRecords, setPatientRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [doctorsMap, setDoctorsMap] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Fetch doctors for mapping their real names on the timeline
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

  // Handle mock IPFS document view
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

  // Retrieve patient history from blockchain
  const getPatientHistory = async (walletAddress) => {
      if(!walletAddress) return;
      setLoadingRecords(true);
      try {
          const hashes = await getPatientRecords(walletAddress);
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
          detailedRecords.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
          setPatientRecords(detailedRecords);
      } catch(e) {
          console.error(e);
          setPatientRecords([]);
      } finally {
          setLoadingRecords(false);
      }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get(`/auth/patients/search/${searchHash}`);
      setPatientData(res.data);
      if(res.data.walletAddress) {
        setForm({...form, patientWallet: res.data.walletAddress, patientHashId: searchHash});
        // We no longer fetch history here, just prepare for adding
      }
    } catch (err) {
      alert("Patient not found!");
      setPatientData(null);
    }
  };

  const handleTrackPatient = async (e) => {
    e.preventDefault();
    if (!trackPatientHash) return;
    setTracking(true);
    setTrackedPatientData(null);
    setPatientRecords([]); // clear previous
    
    try {
      // 1. Resolve Patient Hash to Wallet Address via Backend
      const res = await api.get(`/auth/patients/search/${trackPatientHash}`);
      setTrackedPatientData(res.data);
      if(res.data.walletAddress) {
         // 2. Fetch their timeline from Blockchain
         await getPatientHistory(res.data.walletAddress);
      }
    } catch(err) {
      console.error(err);
      alert("Patient not found or error fetching timeline.");
      setTrackedPatientData(null);
    } finally {
      setTracking(false);
    }
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    if (!account) return alert("Please connect wallet first");
    if (!isAuthorized) return alert("Please authorize your wallet on the blockchain first!");
    if (!form.patientWallet) return alert("Please search for a patient first to load their wallet");
    
    setUploading(true);
    try {
      // 1. Upload data to mock IPFS (backend)
      const dataToUpload = JSON.stringify({ diagnosis: form.diagnosis, prescription: form.prescription });
      const ipfsHash = await uploadToMockIPFS(api, dataToUpload);
      
      // 2. Add to blockchain
      const recordHash = "REC-" + Date.now() + "-" + Math.floor(Math.random()*1000);
      await addMedicalRecord(recordHash, form.patientWallet, ipfsHash);
      
      alert(`Record Added Successfully!\nRecord Hash: ${recordHash}\nIPFS Hash: ${ipfsHash}`);
      setForm({ ...form, diagnosis: '', prescription: '' }); // keep patient details in form so they don't have to search again
    } catch (err) {
      console.error(err);
      alert("Error adding record. Check console.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-slate-100 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold border-b pb-4 text-primary">Doctor Portal</h2>
        </div>
        <div className="flex-1 px-4 space-y-2">
           <div 
             onClick={() => setActiveTab('add')}
             className={`p-3 rounded-lg cursor-pointer flex items-center transition ${activeTab === 'add' ? 'bg-primary-light text-primary font-medium' : 'hover:bg-slate-100 text-slate-700'}`}>
             <PlusCircle className="mr-2 w-5 h-5"/> Add Record
           </div>
           <div 
             onClick={() => setActiveTab('track')}
             className={`p-3 rounded-lg cursor-pointer flex items-center transition ${activeTab === 'track' ? 'bg-primary-light text-primary font-medium' : 'hover:bg-slate-100 text-slate-700'}`}>
             <Search className="mr-2 w-5 h-5"/> Track Record
           </div>
        </div>
        <div className="p-4 border-t">
          <div className="mb-4 text-sm break-words">
            <span className="font-bold">Wallet:</span><br/>
            {account ? 
              <>
                <span className="text-emerald-600 block mb-2">{account.substring(0,8)}...{account.substring(36)}</span>
                {isAuthorized ? 
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Blockchain Verified</span> :
                  <button onClick={handleAuthorize} disabled={uploading} className="text-xs bg-red-100 text-red-800 hover:bg-red-200 px-2 py-1 rounded border border-red-300">Unverified! Click to Authorize</button>
                }
              </>
              : 
              <button className="text-blue-500 hover:underline" onClick={connectWallet}>Connect Wallet</button>
            }
          </div>
          <button onClick={logout} className="flex items-center text-red-500 hover:text-red-700">
            <LogOut className="mr-2 w-5 h-5"/> Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-10">
        <h1 className="text-3xl font-bold mb-8">Welcome, Dr. {user.name}</h1>
        
        {activeTab === 'add' && (
          <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient Search */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center"><Search className="mr-2 text-primary"/> Search Patient</h2>
            <form onSubmit={handleSearch} className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Patient Hash ID" 
                className="input-field"
                value={searchHash}
                onChange={e => setSearchHash(e.target.value)}
              />
              <button type="submit" className="btn-primary">Search</button>
            </form>
            {patientData && (
              <div className="mt-6 p-4 bg-slate-50 border rounded-lg">
                <p><strong>Name:</strong> {patientData.name}</p>
                <p><strong>Email:</strong> {patientData.email}</p>
                <p className="text-sm truncate"><strong>Wallet:</strong> {patientData.walletAddress}</p>
                <p className="text-xs text-slate-400 mt-2">Patient ID verified. You may now append records to this user.</p>
              </div>
            )}
          </div>

          {/* Add Record */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center"><PlusCircle className="mr-2 text-secondary"/> New Medical Record</h2>
            <form onSubmit={handleSubmitRecord} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Patient Wallet Address</label>
                  <input readOnly value={form.patientWallet} className="input-field bg-slate-100" placeholder="Load from search" />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Diagnosis</label>
                  <textarea required value={form.diagnosis} onChange={e=>setForm({...form, diagnosis: e.target.value})} className="input-field h-24" placeholder="Enter diagnosis details"></textarea>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Prescription / Notes</label>
                  <textarea required value={form.prescription} onChange={e=>setForm({...form, prescription: e.target.value})} className="input-field h-24" placeholder="Enter prescription"></textarea>
               </div>
               <button disabled={uploading || !form.patientWallet} className={`w-full ${uploading ? 'bg-slate-400' : 'btn-secondary'} py-3 text-white rounded-lg`}>
                 {uploading ? 'Encrypting & Uploading to Blockchain...' : 'Commit Record to Blockchain'}
               </button>
            </form>
          </div>
        </div>
        </>
        )}

        {activeTab === 'track' && (
          <div className="card max-w-4xl mt-8">
            <h2 className="text-xl font-bold mb-4 flex items-center"><Search className="mr-2 text-primary"/> Track Patient Records</h2>
            <p className="text-slate-500 mb-6">Enter a Patient's Hash ID to retrieve their complete immutable medical timeline directly from the blockchain.</p>
            <form onSubmit={handleTrackPatient} className="flex space-x-2 mb-8">
              <input 
                type="text" 
                placeholder="Enter Patient Hash ID" 
                className="input-field max-w-md"
                value={trackPatientHash}
                onChange={e => setTrackPatientHash(e.target.value)}
                required
              />
              <button type="submit" disabled={tracking} className="btn-primary whitespace-nowrap">
                {tracking ? 'Locating...' : 'Track Timeline'}
              </button>
            </form>

            {/* Patient Records Timeline View */}
            {trackedPatientData && (
                <div className="mt-8 animate-in fade-in duration-300">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg mb-6 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-emerald-800 font-bold">Patient Resolved: {trackedPatientData.name}</p>
                            <p className="text-xs text-slate-500 font-mono break-all mt-1">{trackedPatientData.walletAddress}</p>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold mb-6 flex items-center border-b pb-4"><Clock className="mr-2 text-slate-400"/> Medical History</h2>
                    
                    {loadingRecords && <p className="text-center p-8 text-slate-500 animate-pulse">Querying blockchain for patient records...</p>}
                    
                    {!loadingRecords && patientRecords.length === 0 && (
                        <div className="text-center p-8 bg-slate-50 rounded border border-dashed text-slate-500">No medical records found on the blockchain for this patient.</div>
                    )}

                    {!loadingRecords && patientRecords.length > 0 && (
                         <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {patientRecords.map((rec, idx) => (
                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Timeline Icon */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 group-[.is-active]:bg-emerald-500 text-white group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    {/* Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm hover:shadow-md transition bg-slate-50">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-slate-800 text-sm">Consultation</div>
                                            <time className="font-mono text-xs text-emerald-600">{rec.timestamp}</time>
                                        </div>
                                        <div className="text-slate-500 text-xs mb-3 truncate" title={rec.recordHash}>Record ID: {rec.recordHash}</div>
                                        <div className="text-slate-500 text-xs mb-3 truncate">
                                            Dr: {doctorsMap[rec.doctorWallet.toLowerCase()] ? `Dr. ${doctorsMap[rec.doctorWallet.toLowerCase()]}` : rec.doctorWallet}
                                        </div>
                                        <button 
                                            type="button"
                                            className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 py-1.5 px-3 rounded flex items-center transition"
                                            onClick={() => setSelectedReport(rec.ipfsHash)}
                                        >
                                            <Download className="w-3 h-3 mr-1" /> View Encrypted Record
                                        </button>
                                    </div>
                                </div>
                            ))}
                         </div>
                    )}
                </div>
            )}
          </div>
        )}

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

export default DashboardDoctor;
