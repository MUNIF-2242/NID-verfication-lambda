const express = require("express");
const AWS = require("aws-sdk");

require("dotenv").config(); // Ensure environment variables are loaded

const app = express();
const port = 3000;

const cors = require("cors");
app.use(cors());

// Configure AWS
AWS.config.update({
  region: "us-east-1",
  accessKeyId: process.env.YOUR_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.YOUR_AWS_SECRET_ACCESS_KEY,
});

app.use(express.json({ limit: "50mb" }));

//const BankData = require("./data/main");

const fs = require("fs");
const path = require("path");

// Import the BankData object
const BankData = require("./data/main");
const BankDataPath = path.join(__dirname, "./data/main.js");

app.get("/banks", (req, res) => {
  // Extract all unique banks
  const banks = BankData.banks.map((bank) => ({
    name: bank.name,
    bankCode: bank.bankCode,
  }));

  return res.status(200).json({
    status: "success",
    data: banks,
  });
});
app.get("/districts", (req, res) => {
  const { bankCode } = req.query;

  // Find the bank by bankCode
  const bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  // Extract districts
  const districts = bank.districts.map((district) => ({
    name: district.name,
    districtCode: district.districtCode,
  }));

  return res.status(200).json({
    status: "success",
    data: districts,
  });
});
app.get("/branches", (req, res) => {
  const { bankCode, districtCode } = req.query;

  // Find the bank by bankCode
  const bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  // Find the district within the bank
  const district = bank.districts.find((d) => d.districtCode === districtCode);

  if (!district) {
    return res.status(404).json({
      status: "error",
      message: "District not found",
    });
  }

  // Extract branches
  const branches = district.branches.map((branch) => ({
    name: branch.name,
    branchCode: branch.branchCode,
  }));

  return res.status(200).json({
    status: "success",
    data: branches,
  });
});
app.get("/routing-number", (req, res) => {
  const { bankCode, districtCode, branchCode } = req.query;

  // Find the bank by bankCode
  const bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  // Find the district within the bank
  const district = bank.districts.find((d) => d.districtCode === districtCode);

  if (!district) {
    return res.status(404).json({
      status: "error",
      message: "District not found",
    });
  }

  // Find the branch within the district
  const branch = district.branches.find((b) => b.branchCode === branchCode);

  if (!branch) {
    return res.status(404).json({
      status: "error",
      message: "Branch not found",
    });
  }

  // Return the routing number
  return res.status(200).json({
    status: "success",
    data: {
      routingNumber: branch.routingNumber,
    },
  });
});
app.get("/get-bank-details", (req, res) => {
  const { bankCode } = req.query;

  if (bankCode) {
    // If bankCode is provided, find and return the specific bank with counts
    const bank = BankData.banks.find((b) => b.bankCode === bankCode);

    if (!bank) {
      return res.status(404).json({
        status: "error",
        message: "Bank not found",
      });
    }

    // Calculate counts
    const districtCount = bank.districts.length;
    const branchCount = bank.districts.reduce(
      (total, district) => total + district.branches.length,
      0
    );

    return res.status(200).json({
      status: "success",
      data: {
        bank,
        counts: {
          districts: districtCount,
          branches: branchCount,
          totalBanks: BankData.banks.length,
        },
      },
    });
  } else {
    // If bankCode is not provided, return all banks with counts
    const banksWithCounts = BankData.banks.map((bank) => {
      const districtCount = bank.districts.length;
      const branchCount = bank.districts.reduce(
        (total, district) => total + district.branches.length,
        0
      );

      return {
        ...bank,
        counts: {
          districts: districtCount,
          branches: branchCount,
        },
      };
    });

    return res.status(200).json({
      status: "success",
      data: {
        banks: banksWithCounts,
        totalBanks: BankData.banks.length,
      },
    });
  }
});

app.post("/add-bank-data", (req, res) => {
  const {
    bankName,
    bankCode,
    districtName,
    districtCode,
    branchName,
    branchCode,
    routingNumber,
  } = req.body;

  if (
    !bankName ||
    !bankCode ||
    !districtName ||
    !districtCode ||
    !branchName ||
    !branchCode ||
    !routingNumber
  ) {
    return res.status(400).json({
      status: "error",
      message: "All fields are required",
    });
  }

  // Check if the bank with the same name or code already exists
  let existingBank = BankData.banks.find(
    (b) => b.bankCode === bankCode || b.name === bankName
  );

  if (existingBank) {
    if (existingBank.bankCode === bankCode) {
      return res.status(400).json({
        status: "error",
        message: "Bank with this code already exists",
      });
    } else if (existingBank.name === bankName) {
      return res.status(400).json({
        status: "error",
        message: "Bank with this name already exists",
      });
    }
  }

  // Check if the routing number is unique across all branches
  let existingRoutingNumber = BankData.banks.some((bank) =>
    bank.districts.some((district) =>
      district.branches.some((branch) => branch.routingNumber === routingNumber)
    )
  );

  if (existingRoutingNumber) {
    return res.status(400).json({
      status: "error",
      message: "Branch with this routing number already exists",
    });
  }

  // Create a new bank if it does not exist
  let bank = {
    name: bankName,
    bankCode,
    districts: [],
  };
  BankData.banks.push(bank);

  // Check if the district exists within the bank
  let district = bank.districts.find((d) => d.districtCode === districtCode);

  if (!district) {
    // If district does not exist, create a new one
    district = {
      name: districtName,
      districtCode,
      branches: [],
    };
    bank.districts.push(district);
  }

  // Check if the branch with the same code or name already exists within the district
  let existingBranch = district.branches.find(
    (b) => b.branchCode === branchCode || b.name === branchName
  );

  if (existingBranch) {
    if (existingBranch.branchCode === branchCode) {
      return res.status(400).json({
        status: "error",
        message: "Branch with this code already exists",
      });
    } else if (existingBranch.name === branchName) {
      return res.status(400).json({
        status: "error",
        message: "Branch with this name already exists",
      });
    }
  }

  // Add new branch to the district
  const newBranch = {
    name: branchName,
    branchCode,
    routingNumber,
  };
  district.branches.push(newBranch);

  // Save the updated BankData back to the JavaScript file
  const updatedBankData = `module.exports = ${JSON.stringify(
    BankData,
    null,
    2
  )};`;
  fs.writeFileSync(BankDataPath, updatedBankData);

  return res.status(201).json({
    status: "success",
    message: "Bank data added successfully",
    data: { bank },
  });
});

app.post("/add-district", (req, res) => {
  const {
    bankCode,
    districtName,
    districtCode,
    branchName,
    branchCode,
    routingNumber,
  } = req.body;

  if (
    !bankCode ||
    !districtName ||
    !districtCode ||
    !branchName ||
    !branchCode ||
    !routingNumber
  ) {
    return res.status(400).json({
      status: "error",
      message:
        "Bank code, district name, district code, branch name, branch code, and routing number are required",
    });
  }

  // Find the bank
  let bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  // Check if the district name or district code already exists
  let district = bank.districts.find(
    (d) => d.districtCode === districtCode || d.name === districtName
  );

  if (district) {
    return res.status(400).json({
      status: "error",
      message: "District with this name or code already exists",
    });
  }

  // Create a new district since it does not exist
  district = {
    name: districtName,
    districtCode,
    branches: [],
  };
  bank.districts.push(district);

  // Check if the branch code or routing number already exists within the district
  const existingBranch = district.branches.find(
    (b) => b.branchCode === branchCode || b.routingNumber === routingNumber
  );

  if (existingBranch) {
    return res.status(400).json({
      status: "error",
      message: "Branch with this branch code or routing number already exists",
    });
  }

  // Add new branch to the newly created district
  const newBranch = {
    name: branchName,
    branchCode,
    routingNumber,
  };
  district.branches.push(newBranch);

  return res.status(201).json({
    status: "success",
    message: "District and branch added successfully",
    data: { bank },
  });
});

app.post("/add-branch", (req, res) => {
  const { bankCode, districtCode, branchName, branchCode, routingNumber } =
    req.body;

  if (
    !bankCode ||
    !districtCode ||
    !branchName ||
    !branchCode ||
    !routingNumber
  ) {
    return res.status(400).json({
      status: "error",
      message: "All fields are required",
    });
  }

  // Find the bank by bankCode
  const bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  // Find the district within the bank
  let district = bank.districts.find((d) => d.districtCode === districtCode);

  if (!district) {
    // If district does not exist, create a new one
    district = {
      name: req.body.districtName,
      districtCode,
      branches: [],
    };
    bank.districts.push(district);
  }

  // Check for duplicate branch name within the district
  const existingBranch = district.branches.find((b) => b.name === branchName);

  if (existingBranch) {
    return res.status(400).json({
      status: "error",
      message: "Branch with this name already exists in the district",
    });
  }

  // Check for duplicate branch code within the district
  const existingBranchCode = district.branches.find(
    (b) => b.branchCode === branchCode
  );

  if (existingBranchCode) {
    return res.status(400).json({
      status: "error",
      message: "Branch with this code already exists in the district",
    });
  }

  // Check for duplicate routing number
  const existingRoutingNumber = district.branches.find(
    (b) => b.routingNumber === routingNumber
  );

  if (existingRoutingNumber) {
    return res.status(400).json({
      status: "error",
      message: "Branch with this routing number already exists in the district",
    });
  }

  // Add new branch
  const newBranch = {
    name: branchName,
    branchCode,
    routingNumber,
  };

  district.branches.push(newBranch);

  return res.status(201).json({
    status: "success",
    message: "Branch added successfully",
    data: newBranch,
  });
});
app.delete("/delete-bank", (req, res) => {
  const { bankCode } = req.query;

  if (!bankCode) {
    return res.status(400).json({
      status: "error",
      message: "Bank code is required",
    });
  }

  const bankIndex = BankData.banks.findIndex((b) => b.bankCode === bankCode);

  if (bankIndex === -1) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  BankData.banks.splice(bankIndex, 1);

  return res.status(200).json({
    status: "success",
    message: "Bank deleted successfully",
  });
});
app.delete("/delete-district", (req, res) => {
  const { bankCode, districtCode } = req.query;

  if (!bankCode || !districtCode) {
    return res.status(400).json({
      status: "error",
      message: "Bank code and district code are required",
    });
  }

  const bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  const districtIndex = bank.districts.findIndex(
    (d) => d.districtCode === districtCode
  );

  if (districtIndex === -1) {
    return res.status(404).json({
      status: "error",
      message: "District not found",
    });
  }

  bank.districts.splice(districtIndex, 1);

  return res.status(200).json({
    status: "success",
    message: "District deleted successfully",
  });
});
app.delete("/delete-branch", (req, res) => {
  const { bankCode, districtCode, branchCode } = req.query;

  if (!bankCode || !districtCode || !branchCode) {
    return res.status(400).json({
      status: "error",
      message: "Bank code, district code, and branch code are required",
    });
  }

  const bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  const district = bank.districts.find((d) => d.districtCode === districtCode);

  if (!district) {
    return res.status(404).json({
      status: "error",
      message: "District not found",
    });
  }

  const branchIndex = district.branches.findIndex(
    (b) => b.branchCode === branchCode
  );

  if (branchIndex === -1) {
    return res.status(404).json({
      status: "error",
      message: "Branch not found",
    });
  }

  district.branches.splice(branchIndex, 1);

  return res.status(200).json({
    status: "success",
    message: "Branch deleted successfully",
  });
});
app.put("/update-bank", (req, res) => {
  const { bankCode, newName } = req.body;

  if (!bankCode || !newName) {
    return res.status(400).json({
      status: "error",
      message: "Bank code and new name are required",
    });
  }

  // Find the bank
  const bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  // Update the bank name
  bank.name = newName;

  return res.status(200).json({
    status: "success",
    message: "Bank updated successfully",
    data: { bank },
  });
});
app.put("/update-district", (req, res) => {
  const { bankCode, districtCode, newName } = req.body;

  if (!bankCode || !districtCode || !newName) {
    return res.status(400).json({
      status: "error",
      message: "Bank code, district code, and new name are required",
    });
  }

  // Find the bank
  const bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  // Find the district
  const district = bank.districts.find((d) => d.districtCode === districtCode);

  if (!district) {
    return res.status(404).json({
      status: "error",
      message: "District not found",
    });
  }

  // Update the district name
  district.name = newName;

  return res.status(200).json({
    status: "success",
    message: "District updated successfully",
    data: { bank },
  });
});
app.put("/update-branch", (req, res) => {
  const { bankCode, districtCode, branchCode, newName, newRoutingNumber } =
    req.body;

  if (
    !bankCode ||
    !districtCode ||
    !branchCode ||
    !newName ||
    !newRoutingNumber
  ) {
    return res.status(400).json({
      status: "error",
      message:
        "Bank code, district code, branch code, new name, and new routing number are required",
    });
  }

  // Find the bank
  const bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  // Find the district
  const district = bank.districts.find((d) => d.districtCode === districtCode);

  if (!district) {
    return res.status(404).json({
      status: "error",
      message: "District not found",
    });
  }

  // Find the branch
  const branch = district.branches.find((b) => b.branchCode === branchCode);

  if (!branch) {
    return res.status(404).json({
      status: "error",
      message: "Branch not found",
    });
  }

  // Update branch details
  branch.name = newName;
  branch.routingNumber = newRoutingNumber;

  return res.status(200).json({
    status: "success",
    message: "Branch updated successfully",
    data: { bank },
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
