import React, { useState, useEffect } from "react";
import axios from "axios";

const BranchReport = () => {
  const [banks, setBanks] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [filteredBranches, setFilteredBranches] = useState([]);

  useEffect(() => {
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
    setSelectedDistrict(""); // Reset selected district when changing banks
    setBranches([]);
    setFilteredBranches([]);
    if (bankCode) {
      axios
        .get(`http://localhost:3000/districts?bankCode=${bankCode}`)
        .then((response) => {
          setDistricts(response.data.data);
        })
        .catch((error) => console.error("Error fetching districts:", error));
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
      let url = `http://localhost:3000/branches?bankCode=${selectedBank}`;

      if (selectedDistrict && selectedDistrict !== "all") {
        url += `&districtCode=${selectedDistrict}`;
      }

      axios
        .get(url)
        .then((response) => {
          const branchesData = response.data.data;
          console.log(branchesData);

          let enrichedBranches;

          if (selectedDistrict === "all" || !selectedDistrict) {
            // Enrich branches with districtName for all districts
            enrichedBranches = branchesData.map((branch) => ({
              ...branch,
              districtName:
                districts.find(
                  (district) => district.districtCode === branch.districtCode
                )?.name || "Unknown",
              routingNumber: branch.routingNumber || "N/A",
            }));
          } else {
            // Enrich branches with districtName for a specific district
            enrichedBranches = branchesData.map((branch) => ({
              ...branch,
              districtName:
                districts.find(
                  (district) => district.districtCode === selectedDistrict
                )?.name || "N/A",
              routingNumber: branch.routingNumber || "N/A",
            }));
          }

          setFilteredBranches(enrichedBranches);
        })
        .catch((error) => console.error("Error fetching branches:", error));
    }
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
                <th>Branch Code</th>
                <th>Branch Name</th>
                <th>District Name</th>
                <th>Routing Number</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch) => (
                <tr key={branch.branchCode}>
                  <td>{branch.branchCode}</td>
                  <td>{branch.name}</td>
                  <td>{branch.districtName || "N/A"}</td>
                  <td>{branch.routingNumber || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BranchReport;
