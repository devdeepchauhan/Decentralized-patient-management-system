import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const Web3Context = createContext();

// Typically this comes from a deployed contract address
import contractData from '../../../contracts/contract-address.json';
const CONTRACT_ADDRESS = contractData?.MedicalRecords || '0x0000000000000000000000000000000000000000'; // Fallback if not found

const abi = [
  "function addRecord(string _recordHash, address _patientWallet, string _ipfsHash) public",
  "function getRecordByHash(string _recordHash) public view returns (string, address, address, uint256, string)",
  "function getPatientRecords(address _patientWallet) public view returns (string[])",
  "function verifyDoctor(address _doctor) public view returns (bool)",
  "function addDoctor(address _doctor) public"
];

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    // If we're using mock local environment, we can set it up here.
    // In a real app, this waits for wallet connection
    const setupLocalWeb3 = async () => {
      try {
        if (window.ethereum) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);

          const signer = await web3Provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);

          const web3Contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          setContract(web3Contract);
        } else {
          // Fallback to local hardhat provider
          const web3Provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
          setProvider(web3Provider);
          const signer = await web3Provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);

          const web3Contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          setContract(web3Contract);
        }
      } catch (err) {
        console.error("Web3 init error:", err);
      }
    };
    
    setupLocalWeb3();
  }, []);

  const switchToSepoliaNetwork = async () => {
    try {
      // Prompt user to switch to Sepolia test network (Chain ID 11155111 -> 0xaa36a7)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                rpcUrls: ['https://rpc.sepolia.org'],
                nativeCurrency: {
                  name: 'Sepolia Ether',
                  symbol: 'SEP',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add the network:", addError);
          alert("Failed to add the Sepolia Testnet to MetaMask.");
          return false;
        }
      } else {
        console.error("Failed to switch network:", switchError);
        alert("Please switch your MetaMask network to Sepolia.");
        return false;
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or a Web3 wallet");
      return;
    }

    const success = await switchToSepoliaNetwork();
    if (!success) return;

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0]);
    // Re-setup contract with new signer
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await web3Provider.getSigner();
    setProvider(web3Provider);
    setContract(new ethers.Contract(CONTRACT_ADDRESS, abi, signer));
  };

  const addMedicalRecord = async (hash, patientWallet, ipfsHash) => {
    if (!contract) return null;
    const tx = await contract.addRecord(hash, patientWallet, ipfsHash);
    await tx.wait();
    return tx;
  };

  const getRecord = async (hash) => {
    if (!contract) return null;
    return await contract.getRecordByHash(hash);
  };

  const getPatientRecords = async (patientWallet) => {
    if (!contract) return [];
    return await contract.getPatientRecords(patientWallet);
  };

  const verifyDoctorRole = async (address) => {
    if (!contract || !address) return false;
    return await contract.verifyDoctor(address);
  };

  const authorizeDoctor = async (address) => {
    if (!contract || !address) return null;
    
    // Ensure we are on the correct network before sending a transaction
    const success = await switchToSepoliaNetwork();
    if (!success) throw new Error("Could not switch to Sepolia network");

    // Re-instantiate contract with latest signer, just in case network switch happened
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await web3Provider.getSigner();
    const activeContract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    const tx = await activeContract.addDoctor(address);
    await tx.wait();
    return tx;
  };

  return (
    <Web3Context.Provider value={{ account, contract, provider, connectWallet, addMedicalRecord, getRecord, getPatientRecords, verifyDoctorRole, authorizeDoctor }}>
      {children}
    </Web3Context.Provider>
  );
};
