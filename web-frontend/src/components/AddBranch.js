import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useParams } from "react-router-dom";

const AddBranch = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const bankCode = query.get("bankCode"); // Extract bankCode from query parameters
  const [formData, setFormData] = useState({
    districtCode: "",
    branchName: "",
    branchCode: "",
    routingNumber: "",
  });

  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    // Fetch districts from the API
    const fetchDistricts = async () => {
      try {
        const response = await axios.get("http://localhost:3000/districts");
        if (response.data.status === "success") {
          setDistricts(response.data.data);
        } else {
          alert("Failed to fetch districts");
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
        alert("An error occurred while fetching districts");
      }
    };

    fetchDistricts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      bankCode, // Include bankCode from the URL parameter
    };

    console.log(dataToSubmit);
    try {
      // Submit branch data
      const response = await axios.post(
        "http://localhost:3000/add-branch",
        dataToSubmit
      );

      console.log("Response:", response.data);
      if (response.data.status === "error") {
        alert(response.data.message);
        return;
      }
      alert("Branch added successfully");
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
        <h2>Add Branch</h2>
        {/* Bank Code is not displayed anymore, it's taken from the URL */}
        <select
          name="districtCode"
          value={formData.districtCode}
          onChange={handleChange}
        >
          <option value="">Select District</option>
          {districts.map((district) => (
            <option key={district.districtCode} value={district.districtCode}>
              {district.name}
            </option>
          ))}
        </select>
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
        <button type="submit">Add Branch</button>
      </form>
    </div>
  );
};

export default AddBranch;
