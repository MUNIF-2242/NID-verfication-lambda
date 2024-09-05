import React, { useState, useEffect } from "react";
import axios from "axios";

const BranchReport = () => {
  const [banks, setBanks] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [editBranchCode, setEditBranchCode] = useState(null);
  const [editableBranch, setEditableBranch] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3000/get-bank-details")
      .then((response) => {
        const bankData = response.data.data.banks;
        setBanks(bankData);
      })
      .catch((error) => console.error("Error fetching banks:", error));
  }, []);

  const handleBankChange = (e) => {
    const bankCode = e.target.value;
    setSelectedBank(bankCode);
    setSelectedDistrict("");
    setFilteredBranches([]);

    if (bankCode) {
      axios
        .get(`http://localhost:3000/get-bank-details?bankCode=${bankCode}`)
        .then((response) => {
          const bank = response.data.data.bank;
          setDistricts(bank.districts);
        })
        .catch((error) => console.error("Error fetching bank details:", error));
    } else {
      setDistricts([]);
    }
  };

  const handleDistrictChange = (e) => {
    const districtCode = e.target.value;
    setSelectedDistrict(districtCode);
  };

  const handleSearchBranches = () => {
    if (selectedBank) {
      axios
        .get(`http://localhost:3000/get-bank-details?bankCode=${selectedBank}`)
        .then((response) => {
          const bank = response.data.data.bank;
          let filteredBranchesData;

          if (selectedDistrict === "all" || !selectedDistrict) {
            filteredBranchesData = bank.districts.flatMap((district) =>
              district.branches.map((branch) => ({
                ...branch,
                bankName: bank.name,
                bankCode: bank.bankCode,
                districtName: district.name,
                districtCode: district.districtCode,
                routingNumber: branch.routingNumber || "N/A",
              }))
            );
          } else {
            const selectedDistrictData = bank.districts.find(
              (district) => district.districtCode === selectedDistrict
            );
            filteredBranchesData =
              selectedDistrictData?.branches.map((branch) => ({
                ...branch,
                bankName: bank.name,
                bankCode: bank.bankCode,
                districtName: selectedDistrictData.name,
                districtCode: selectedDistrictData.districtCode,
                routingNumber: branch.routingNumber || "N/A",
              })) || [];
          }

          setFilteredBranches(filteredBranchesData);
        })
        .catch((error) => console.error("Error fetching branches:", error));
    }
  };

  const handleDelete = (branch) => {
    const { bankCode, districtCode, branchCode } = branch;
    axios
      .delete(`http://localhost:3000/delete-branch`, {
        params: { bankCode, districtCode, branchCode },
      })
      .then((response) => {
        if (response.data.status === "success") {
          setFilteredBranches(
            filteredBranches.filter((b) => b.branchCode !== branchCode)
          );
        }
      })
      .catch((error) => console.error("Error deleting branch:", error));
  };

  const handleEdit = (branch) => {
    setEditBranchCode(branch.branchCode);
    setEditableBranch({ ...branch });
  };

  const handleCancelEdit = () => {
    setEditBranchCode(null);
    setEditableBranch(null);
  };

  const handleSaveEdit = () => {
    axios
      .put("http://localhost:3000/update-branch", {
        bankCode: editableBranch.bankCode,
        districtCode: editableBranch.districtCode,
        branchCode: editableBranch.branchCode,
        newName: editableBranch.name,
        newRoutingNumber: editableBranch.routingNumber,
      })
      .then((response) => {
        if (response.data.status === "success") {
          setFilteredBranches(
            filteredBranches.map((branch) =>
              branch.branchCode === editBranchCode
                ? {
                    ...editableBranch,
                    routingNumber: editableBranch.routingNumber,
                  }
                : branch
            )
          );
          setEditBranchCode(null);
          setEditableBranch(null);
        }
      })
      .catch((error) => console.error("Error updating branch:", error));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableBranch({ ...editableBranch, [name]: value });
  };

  return (
    <div>
      <form>
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
          <select value={selectedDistrict} onChange={handleDistrictChange}>
            <option value="">Select District</option>
            <option value="all">All</option>
            {districts.map((district) => (
              <option key={district.districtCode} value={district.districtCode}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={handleSearchBranches}>
          Search Branches
        </button>
      </form>

      {filteredBranches.length > 0 && (
        <div>
          <h3>Branches List</h3>
          <table>
            <thead>
              <tr>
                <th>Bank Code</th>
                <th>Bank Name</th>
                <th>District Code</th>
                <th>District Name</th>
                <th>Branch Code</th>
                <th>Branch Name</th>
                <th>Routing Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch) =>
                editBranchCode === branch.branchCode ? (
                  <tr key={branch.branchCode}>
                    <td>{branch.bankCode}</td>
                    <td>{branch.bankName}</td>
                    <td>{branch.districtCode}</td>
                    <td>{branch.districtName}</td>
                    <td>{branch.branchCode}</td>
                    <td>
                      <input
                        name="name"
                        value={editableBranch.name}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <input
                        name="routingNumber"
                        value={editableBranch.routingNumber}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <button onClick={handleSaveEdit}>Save</button>
                      <button onClick={handleCancelEdit}>Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={branch.branchCode}>
                    <td>{branch.bankCode}</td>
                    <td>{branch.bankName}</td>
                    <td>{branch.districtCode}</td>
                    <td>{branch.districtName}</td>
                    <td>{branch.branchCode}</td>
                    <td>{branch.name}</td>
                    <td>{branch.routingNumber}</td>
                    <td>
                      <button onClick={() => handleEdit(branch)}>Edit</button>
                      <button onClick={() => handleDelete(branch)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BranchReport;
