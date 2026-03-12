import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Database, FileKey } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 bg-white shadow-sm">
        <div className="flex items-center space-x-2">
          <img src="/logo.svg" alt="DPMS Logo" className="w-10 h-10 drop-shadow-md" />
          <span className="text-xl font-bold text-slate-800 tracking-wide">DPMS</span>
        </div>
        <div className="space-x-4">
          <Link to="/login" className="btn-primary">Login System</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 text-center bg-gradient-to-br from-primary-light/50 to-white">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Decentralized Patient <br className="hidden md:block"/> Management System
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
          Secure, immutable, and transparent medical records powered by blockchain technology. 
          Patients own their data, verified doctors can append it, and everyone stays secure.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/login?role=DOCTOR" className="btn-primary flex items-center justify-center py-3 px-8 text-lg">
            Doctor Portal
          </Link>
          <Link to="/login?role=PATIENT" className="btn-secondary flex items-center justify-center py-3 px-8 text-lg">
            Patient Portal
          </Link>
          <Link to="/login?role=STAFF" className="bg-slate-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors duration-200 shadow-sm flex items-center justify-center text-lg">
            Staff Portal
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-primary">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800">Immutable Records</h3>
            <p className="text-slate-600">Built on Ethereum smart contracts, medical reports cannot be altered or deleted once uploaded.</p>
          </div>
          <div className="card text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-4 text-secondary">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800">Decentralized Storage</h3>
            <p className="text-slate-600">Documents are pinned to IPFS and linked via a unique hash on the blockchain, ensuring high availability and privacy.</p>
          </div>
          <div className="card text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
              <FileKey className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800">Hash-Based Retrieval</h3>
            <p className="text-slate-600">Instant access to your timeline of visits and prescriptions using your unique identity hash.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
