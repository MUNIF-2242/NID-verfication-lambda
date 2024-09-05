import React, { useState } from "react";
import axios from "axios";

const AddBank = () => {
  const [formData, setFormData] = useState({
    bankName: "",
    bankCode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Submit bank data
      const response = await axios.post(
        "http://localhost:3000/add-bank",
        formData
      );
      console.log("Response:", response.data);
      if (response.data.status === "error") {
        alert(response.data.message);
        return;
      }
      alert("Bank added successfully");
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
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Add Bank</button>
      </form>
    </div>
  );
};

export default AddBank;
