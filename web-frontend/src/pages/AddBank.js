import React, { useState } from "react";
import axios from "axios";

const AddBank = () => {
  const [formData, setFormData] = useState({
    bankName: "",
    bankCode: "",
    districtName: "",
    districtCode: "",
    branchName: "",
    branchCode: "",
    routingNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e, action) => {
    e.preventDefault();

    try {
      if (action === "addBank") {
        // Submit bank data
        const bankResponse = await axios.post(
          "http://localhost:3000/add-bank-data",
          formData
        );
        console.log("Bank Response:", bankResponse.data);
        if (bankResponse.data.status === "error") {
          alert(bankResponse.data.message);
          return;
        }
        alert("Bank added successfully");
      } else if (action === "addDistrict") {
        // Submit district data
        const districtResponse = await axios.post(
          "http://localhost:3000/add-district",
          {
            bankCode: formData.bankCode,
            districtName: formData.districtName,
            districtCode: formData.districtCode,
            branchName: formData.branchName,
            branchCode: formData.branchCode,
            routingNumber: formData.routingNumber,
          }
        );
        console.log("District Response:", districtResponse.data);
        if (districtResponse.data.status === "error") {
          alert(districtResponse.data.message);
          return;
        }
        alert("District added successfully");
      } else if (action === "addBranch") {
        // Submit branch data
        const branchResponse = await axios.post(
          "http://localhost:3000/add-branch",
          {
            bankCode: formData.bankCode,
            districtCode: formData.districtCode,
            branchName: formData.branchName,
            branchCode: formData.branchCode,
            routingNumber: formData.routingNumber,
          }
        );
        console.log("Branch Response:", branchResponse.data);
        if (branchResponse.data.status === "error") {
          alert(branchResponse.data.message);
          return;
        }
        alert("Branch added successfully");
      }
    } catch (error) {
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
      alert(
        "An error occurred: " +
          (error.response ? error.response.data.message : error.message)
      );
    }
  };

  return (
    <div>
      <h1>Bank Data Management</h1>
      <form>
        <h2>Add Bank</h2>
        <input
          type="text"
          name="bankName"
          placeholder="Bank Name"
          value={formData.bankName}
          onChange={handleChange}
        />
        <input
          type="text"
          name="bankCode"
          placeholder="Bank Code"
          value={formData.bankCode}
          onChange={handleChange}
        />

        <h2>Add District</h2>
        <input
          type="text"
          name="districtName"
          placeholder="District Name"
          value={formData.districtName}
          onChange={handleChange}
        />
        <input
          type="text"
          name="districtCode"
          placeholder="District Code"
          value={formData.districtCode}
          onChange={handleChange}
        />

        <h2>Add Branch</h2>
        <input
          type="text"
          name="branchName"
          placeholder="Branch Name"
          value={formData.branchName}
          onChange={handleChange}
        />
        <input
          type="text"
          name="branchCode"
          placeholder="Branch Code"
          value={formData.branchCode}
          onChange={handleChange}
        />
        <input
          type="text"
          name="routingNumber"
          placeholder="Routing Number"
          value={formData.routingNumber}
          onChange={handleChange}
        />

        <button type="button" onClick={(e) => handleSubmit(e, "addBank")}>
          Add Bank
        </button>
        <button type="button" onClick={(e) => handleSubmit(e, "addDistrict")}>
          Add District
        </button>
        <button type="button" onClick={(e) => handleSubmit(e, "addBranch")}>
          Add Branch
        </button>
      </form>
    </div>
  );
};

export default AddBank;
