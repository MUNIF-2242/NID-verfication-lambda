const express = require("express");
const AWS = require("aws-sdk");

require("dotenv").config(); // Ensure environment variables are loaded

const app = express();
const port = 5001;

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

// Define path to the district data file
const DistrictDataPath = path.join(__dirname, "data/DistrictData.js");

// Load district data
let DistrictData = require(DistrictDataPath);

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

  let branches = [];

  if (districtCode) {
    // Find the district within the bank
    const district = bank.districts.find(
      (d) => d.districtCode === districtCode
    );

    if (!district) {
      return res.status(404).json({
        status: "error",
        message: "District not found",
      });
    }

    // Extract branches from the specified district
    branches = district.branches.map((branch) => ({
      name: branch.name,
      branchCode: branch.branchCode,
      routingNumber: branch.routingNumber,
      districtCode: district.districtCode, // Add districtCode to each branch
    }));
  } else {
    // Extract all branches from all districts within the bank
    bank.districts.forEach((district) => {
      branches = branches.concat(
        district.branches.map((branch) => ({
          name: branch.name,
          branchCode: branch.branchCode,
          routingNumber: branch.routingNumber,
          districtCode: district.districtCode, // Add districtCode to each branch
        }))
      );
    });
  }

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
  // Extract all unique banks
  const districts = DistrictData.districts.map((district) => ({
    name: district.name,
    districtCode: district.districtCode,
  }));

  return res.status(200).json({
    status: "success",
    data: districts,
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
    // If bankCode is not provided, return all banks with counts, sorted alphabetically by bank name
    const banksWithCounts = BankData.banks
      .map((bank) => {
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
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Sorting banks alphabetically by name

    return res.status(200).json({
      status: "success",
      data: {
        banks: banksWithCounts,
        totalBanks: banksWithCounts.length,
      },
    });
  }
});

///

app.post("/add-bank", (req, res) => {
  const { bankName, bankCode } = req.body;

  if (!bankName || !bankCode) {
    return res.status(400).json({
      status: "error",
      message: "Bank name and code are required",
    });
  }

  // Check if the bank with the same code or name already exists
  let existingBank = BankData.banks.find(
    (b) => b.bankCode === bankCode || b.name === bankName
  );

  if (existingBank) {
    if (existingBank.bankCode === bankCode) {
      return res.status(400).json({
        status: "error",
        message: "A bank with this code already exists",
      });
    }
    if (existingBank.name === bankName) {
      return res.status(400).json({
        status: "error",
        message: "A bank with this name already exists",
      });
    }
  }

  // If bank doesn't exist, create it
  if (!existingBank) {
    const bank = {
      name: bankName,
      bankCode,
      districts: [], // Initialize with an empty array for districts
    };
    BankData.banks.push(bank);

    // Save the updated BankData back to the JavaScript file
    const updatedBankData = `module.exports = ${JSON.stringify(
      BankData,
      null,
      2
    )};`;
    fs.writeFileSync(BankDataPath, updatedBankData);

    return res.status(201).json({
      status: "success",
      message: "Bank added successfully",
      bank,
    });
  }

  // In case the bank already exists (should not reach here due to previous checks)
  return res.status(400).json({
    status: "error",
    message: "Bank with this name or code already exists",
  });
});

app.post("/add-district", (req, res) => {
  const { districtName, districtCode } = req.body;

  // Validate input - only district name and district code are required
  if (!districtName || !districtCode) {
    return res.status(400).json({
      status: "error",
      message: "District name and district code are required",
    });
  }

  // Check if the district already exists in the DistrictData file
  let existingDistrict = DistrictData.districts.find(
    (d) => d.districtCode === districtCode || d.name === districtName
  );

  if (existingDistrict) {
    return res.status(400).json({
      status: "error",
      message: "District with this name or code already exists",
    });
  }

  // Create a new district object
  const newDistrict = {
    name: districtName,
    districtCode,
  };

  // Add the new district to the district data
  DistrictData.districts.push(newDistrict);

  // Save the updated DistrictData back to the DistrictData.js file
  const updatedDistrictData = `module.exports = ${JSON.stringify(
    DistrictData,
    null,
    2
  )};`;
  fs.writeFileSync(DistrictDataPath, updatedDistrictData);

  return res.status(201).json({
    status: "success",
    message: "District added successfully",
    newDistrict,
  });
});
//

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
  let bank = BankData.banks.find((b) => b.bankCode === bankCode);

  if (!bank) {
    return res.status(404).json({
      status: "error",
      message: "Bank not found",
    });
  }

  // Find or create the district within the bank
  let district = bank.districts.find((d) => d.districtCode === districtCode);

  if (!district) {
    // Get the district name from DistrictData
    const districtInfo = DistrictData.districts.find(
      (d) => d.districtCode === districtCode
    );

    if (!districtInfo) {
      return res.status(404).json({
        status: "error",
        message: "District not found in DistrictData",
      });
    }
    console.log("districtInfo+" + districtInfo);

    // Create a new district if not found
    district = {
      name: districtInfo.name,
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

  // Check if the routing number is unique across all branches
  const existingRoutingNumber = BankData.banks.some((bank) =>
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

  // Add new branch
  const newBranch = {
    name: branchName,
    branchCode,
    routingNumber,
  };

  district.branches.push(newBranch);

  // Save the updated BankData back to the JSON file
  const updatedBankData = `module.exports = ${JSON.stringify(
    BankData,
    null,
    2
  )};`;
  fs.writeFileSync(BankDataPath, updatedBankData);

  return res.status(201).json({
    status: "success",
    message: "Branch added successfully",
    data: newBranch,
  });
});

app.delete("/delete-bank", (req, res) => {
  const { bankCode } = req.body;

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

  // Save the updated BankData back to the JavaScript file
  const updatedBankData = `module.exports = ${JSON.stringify(
    BankData,
    null,
    2
  )};`;
  fs.writeFileSync(BankDataPath, updatedBankData);

  return res.status(200).json({
    status: "success",
    message: "Bank deleted successfully",
  });
});

app.delete("/delete-district", (req, res) => {
  const { districtCode } = req.body;

  if (!districtCode) {
    return res.status(400).json({
      status: "error",
      message: "District code is required",
    });
  }

  // Find the index of the district to delete
  const districtIndex = DistrictData.districts.findIndex(
    (d) => d.districtCode === districtCode
  );

  if (districtIndex === -1) {
    return res.status(404).json({
      status: "error",
      message: "District not found",
    });
  }

  // Remove the district from the array
  DistrictData.districts.splice(districtIndex, 1);

  // Save the updated DistrictData back to the file
  const updatedDistrictData = `module.exports = ${JSON.stringify(
    DistrictData,
    null,
    2
  )};`;

  fs.writeFileSync(DistrictDataPath, updatedDistrictData);

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
  const branchIndex = district.branches.findIndex(
    (b) => b.branchCode === branchCode
  );

  if (branchIndex === -1) {
    return res.status(404).json({
      status: "error",
      message: "Branch not found",
    });
  }

  // Remove the branch
  district.branches.splice(branchIndex, 1);

  // Remove the district if it has no branches left
  if (district.branches.length === 0) {
    const districtIndex = bank.districts.findIndex(
      (d) => d.districtCode === districtCode
    );
    if (districtIndex !== -1) {
      bank.districts.splice(districtIndex, 1);
    }
  }

  // Save the updated BankData back to the JavaScript file
  const updatedBankData = `module.exports = ${JSON.stringify(
    BankData,
    null,
    2
  )};`;
  fs.writeFileSync(BankDataPath, updatedBankData);

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

  // Save the updated BankData back to the JavaScript file
  const updatedBankData = `module.exports = ${JSON.stringify(
    BankData,
    null,
    2
  )};`;
  fs.writeFileSync(BankDataPath, updatedBankData);

  return res.status(200).json({
    status: "success",
    message: "Bank updated successfully",
    data: { bank },
  });
});

app.put("/update-district", (req, res) => {
  const { districtCode, newName } = req.body;

  if (!districtCode || !newName) {
    return res.status(400).json({
      status: "error",
      message: "District code and new name are required",
    });
  }

  // Find the district
  const district = DistrictData.districts.find(
    (d) => d.districtCode === districtCode
  );

  if (!district) {
    return res.status(404).json({
      status: "error",
      message: "District not found",
    });
  }

  // Update the district name
  district.name = newName;

  // Save the updated DistrictData back to the file
  const updatedDistrictData = `module.exports = ${JSON.stringify(
    DistrictData,
    null,
    2
  )};`;

  // Write the updated data to DistrictData.js
  fs.writeFileSync(DistrictDataPath, updatedDistrictData);

  return res.status(200).json({
    status: "success",
    message: "District updated successfully",
    district,
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

  // Check if the new routing number already exists in any branch
  const routingNumberExists = BankData.banks.some((b) =>
    b.districts.some((d) =>
      d.branches.some(
        (br) =>
          br.routingNumber === newRoutingNumber && br.branchCode !== branchCode
      )
    )
  );

  if (routingNumberExists) {
    return res.status(400).json({
      status: "error",
      message: "Routing number already exists for another branch",
    });
  }

  // Check if the new branch name already exists in the district
  const branchNameExists = district.branches.some(
    (b) => b.name === newName && b.branchCode !== branchCode
  );

  if (branchNameExists) {
    return res.status(400).json({
      status: "error",
      message: "Branch name already exists in this district",
    });
  }

  // Update branch details
  branch.name = newName;
  branch.routingNumber = newRoutingNumber;

  // Save the updated BankData back to the JavaScript file
  const updatedBankData = `module.exports = ${JSON.stringify(
    BankData,
    null,
    2
  )};`;
  fs.writeFileSync(BankDataPath, updatedBankData);

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
