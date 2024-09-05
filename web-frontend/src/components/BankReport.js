import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BankReportPage = () => {
  const [banks, setBanks] = useState([]);
  const [editingBank, setEditingBank] = useState(null);
  const [newBankName, setNewBankName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch bank details from your API
    axios
      .get("http://localhost:3000/get-bank-details")
      .then((response) => {
        const bankData = response.data.data.banks;
        setBanks(bankData);
      })
      .catch((error) => console.error("Error fetching banks:", error));
  }, []);

  const handleDetailsClick = (bankCode) => {
    // Redirect to the Branch Report page with the bankCode as a query parameter
    navigate(`/branch-info?bankCode=${bankCode}`);
  };

  const handleEditClick = (bank) => {
    // Set the bank being edited
    setEditingBank(bank);
    setNewBankName(bank.name);
  };

  const handleDeleteClick = (bankCode) => {
    // Delete bank
    axios
      .delete("http://localhost:3000/delete-bank", {
        data: { bankCode },
      })
      .then(() => {
        // Remove the deleted bank from the state
        setBanks(banks.filter((b) => b.bankCode !== bankCode));
      })
      .catch((error) => console.error("Error deleting bank:", error));
  };

  const handleSaveEdit = () => {
    if (!editingBank || !newBankName) return;

    // Update bank name
    axios
      .put("http://localhost:3000/update-bank", {
        bankCode: editingBank.bankCode,
        newName: newBankName,
      })
      .then(() => {
        // Update the bank in the state
        setBanks(
          banks.map((b) =>
            b.bankCode === editingBank.bankCode
              ? { ...b, name: newBankName }
              : b
          )
        );
        setEditingBank(null);
        setNewBankName("");
      })
      .catch((error) => console.error("Error updating bank:", error));
  };

  return (
    <div>
      <h2>Bank Report</h2>
      <table>
        <thead>
          <tr>
            <th>Bank Name</th>
            <th>Bank Code</th>
            <th>Number of Districts</th>
            <th>Number of Branches</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {banks.map((bank) => {
            const numDistricts = bank.districts.length;
            const numBranches = bank.districts.reduce(
              (count, district) => count + district.branches.length,
              0
            );

            return (
              <tr key={bank.bankCode}>
                <td>
                  {editingBank?.bankCode === bank.bankCode ? (
                    <input
                      type="text"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                    />
                  ) : (
                    bank.name
                  )}
                </td>
                <td>{bank.bankCode}</td>
                <td>{numDistricts}</td>
                <td>{numBranches}</td>
                <td>
                  {editingBank?.bankCode === bank.bankCode ? (
                    <>
                      <button onClick={handleSaveEdit}>Save</button>
                      <button onClick={() => setEditingBank(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditClick(bank)}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteClick(bank.bankCode)}>
                        Delete
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDetailsClick(bank.bankCode)}>
                    Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BankReportPage;
