import React, { useState, useEffect } from "react";
import axios from "axios";

const BankDetails = () => {
  const [banks, setBanks] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [bankDetails, setBankDetails] = useState(null);

  useEffect(() => {
    // Fetch banks when component mounts
    axios
      .get("http://localhost:3000/banks")
      .then((response) => {
        setBanks(response.data.data);
      })
      .catch((error) => console.error("Error fetching banks:", error));
  }, []);

  const handleBankChange = (e) => {
    const bankCode = e.target.value;
    setSelectedBank(bankCode);
    setSelectedDistrict(""); // Reset district when bank changes
    setSelectedBranch(""); // Reset branch when bank changes
    setDistricts([]);
    setBranches([]);
    setRoutingNumber(""); // Clear routing number on new selection
    setBankDetails(null); // Clear bank details on new selection

    if (bankCode) {
      axios
        .get(`http://localhost:3000/districts?bankCode=${bankCode}`)
        .then((response) => {
          setDistricts(response.data.data);
        })
        .catch((error) => console.error("Error fetching districts:", error));
    }
  };

  const handleDistrictChange = (e) => {
    const districtCode = e.target.value;
    setSelectedDistrict(districtCode);
    setSelectedBranch(""); // Reset branch when district changes
    setBranches([]);
    setRoutingNumber(""); // Clear routing number on new selection
    setBankDetails(null); // Clear bank details on new selection

    if (districtCode) {
      axios
        .get(
          `http://localhost:3000/branches?bankCode=${selectedBank}&districtCode=${districtCode}`
        )
        .then((response) => {
          setBranches(response.data.data);
        })
        .catch((error) => console.error("Error fetching branches:", error));
    }
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
    setRoutingNumber(""); // Clear routing number on new selection
    setBankDetails(null); // Clear bank details on new selection
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedBank && selectedDistrict && selectedBranch) {
      axios
        .get(`http://localhost:3000/routing-number`, {
          params: {
            bankCode: selectedBank,
            districtCode: selectedDistrict,
            branchCode: selectedBranch,
          },
        })
        .then((response) => {
          const { routingNumber } = response.data.data;
          setRoutingNumber(routingNumber);
          setBankDetails({
            bank: banks.find((bank) => bank.bankCode === selectedBank),
            district: districts.find(
              (district) => district.districtCode === selectedDistrict
            ),
            branch: branches.find(
              (branch) => branch.branchCode === selectedBranch
            ),
          });
        })
        .catch((error) => {
          console.error("Error fetching routing number:", error);
          setRoutingNumber("Routing number not found.");
          setBankDetails(null);
        });
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Bank:</label>
          <select value={selectedBank} onChange={handleBankChange}>
            <option value="">Select Bank</option>
            {banks.map((bank) => (
              <option key={bank.bankCode} value={bank.bankCode}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>District:</label>
          <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={!selectedBank}
          >
            <option value="">Select District</option>
            {districts.map((district) => (
              <option key={district.districtCode} value={district.districtCode}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Branch:</label>
          <select
            value={selectedBranch}
            onChange={handleBranchChange}
            disabled={!selectedDistrict}
          >
            <option value="">Select Branch</option>
            {branches.map((branch) => (
              <option key={branch.branchCode} value={branch.branchCode}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={!selectedBranch}>
          Get Routing Number
        </button>
      </form>

      {bankDetails && (
        <div>
          <h3>Bank Details</h3>
          <p>
            <strong>Bank Name:</strong> {bankDetails.bank.name}
          </p>
          <p>
            <strong>District Name:</strong> {bankDetails.district.name}
          </p>
          <p>
            <strong>Branch Name:</strong> {bankDetails.branch.name}
          </p>

          <p>
            <strong>Routing Number:</strong> {routingNumber}
          </p>
        </div>
      )}
    </div>
  );
};

export default BankDetails;
