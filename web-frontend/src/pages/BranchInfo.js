// src/pages/BankInfo.js
import React from "react";

import "./BankInfo.css"; // Optional: For custom styles
import BranchReport from "../components/BranchReport";
import AddBranch from "../components/AddBranch";

import "./BranchInfo.css"; // Optional: For custom styles

const BranchInfo = () => {
  return (
    <div className="branch-info-container">
      <div className="branch-report">
        <BranchReport />
      </div>
      <div className="add-branch">
        <AddBranch />
      </div>
    </div>
  );
};

export default BranchInfo;
