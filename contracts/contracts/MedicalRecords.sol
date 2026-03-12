// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract MedicalRecords {
    struct Record {
        string recordHash;     // Unique identifier
        address patientWallet; 
        address doctorWallet;  
        uint256 timestamp;
        string ipfsHash;       // Pointer to the actual document
    }

    mapping(string => Record) private recordsByHash;
    mapping(address => string[]) private patientRecords;
    
    // Simple role management for demo
    mapping(address => bool) public isDoctor;

    event RecordAdded(string recordHash, address indexed patientWallet, address indexed doctorWallet);

    modifier onlyDoctor() {
        require(isDoctor[msg.sender], "Only authorized doctors can perform this action");
        _;
    }

    constructor() {
        // For development, we'll allow the deployer to be the first doctor
        // In reality, this would be managed more securely
        isDoctor[msg.sender] = true;
    }

    function addDoctor(address _doctor) public {
        // Ideally restricted to admin, simplified here for ease of use
        isDoctor[_doctor] = true;
    }

    function verifyDoctor(address _doctor) public view returns (bool) {
        return isDoctor[_doctor];
    }

    function addRecord(string memory _recordHash, address _patientWallet, string memory _ipfsHash) public onlyDoctor {
        require(bytes(recordsByHash[_recordHash].recordHash).length == 0, "Record with this hash already exists");

        Record memory newRecord = Record({
            recordHash: _recordHash,
            patientWallet: _patientWallet,
            doctorWallet: msg.sender,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash
        });

        recordsByHash[_recordHash] = newRecord;
        patientRecords[_patientWallet].push(_recordHash);

        emit RecordAdded(_recordHash, _patientWallet, msg.sender);
    }

    function getRecordByHash(string memory _recordHash) public view returns (string memory, address, address, uint256, string memory) {
        Record memory rec = recordsByHash[_recordHash];
        require(bytes(rec.recordHash).length != 0, "Record not found");
        
        return (rec.recordHash, rec.patientWallet, rec.doctorWallet, rec.timestamp, rec.ipfsHash);
    }

    function getPatientRecords(address _patientWallet) public view returns (string[] memory) {
        return patientRecords[_patientWallet];
    }
}
