import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'PATIENT', walletAddress: ''
  });
  const { login, register, user, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check url params for role preset
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam) setFormData(prev => ({ ...prev, role: roleParam }));
  }, [location]);

  useEffect(() => {
    if (user) {
      navigate(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            {isRegister ? 'Create an Account' : 'Sign in to DPMS'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Access the decentralized patient management system.
          </p>
        </div>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">{error}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isRegister && (
              <>
                <input
                  name="name"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <select 
                  name="role" 
                  className="input-field"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="STAFF">Staff</option>
                </select>
                {formData.role !== 'STAFF' && (
                  <input
                    name="walletAddress"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ethereum Wallet Address (0x...)"
                    value={formData.walletAddress}
                    onChange={handleChange}
                  />
                )}
              </>
            )}
            <input
              name="email"
              type="email"
              required
              className="input-field"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              required
              className="input-field"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <button type="submit" className="w-full btn-primary py-3 text-lg">
              {isRegister ? 'Register' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4 text-sm text-slate-600">
          <button 
            type="button" 
            onClick={() => setIsRegister(!isRegister)}
            className="text-primary hover:underline font-medium"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
