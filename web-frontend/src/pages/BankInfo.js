// src/pages/BankInfo.js
import React from "react";
import AddBank from "../components/AddBank";
import BankReport from "../components/BankReport";
import "./BankInfo.css"; // Optional: For custom styles

const BankInfo = () => {
  return (
    <div className="bank-info-container">
      <div className="bank-report">
        <BankReport />
      </div>
      <div className="add-bank">
        <AddBank />
      </div>
    </div>
  );
};

export default BankInfo;
