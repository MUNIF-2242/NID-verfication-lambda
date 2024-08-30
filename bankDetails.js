const BankData = require("./data/BankData");

exports.handler = async (event) => {
  console.log("Lambda /bank-details invoked.");

  const findBankDistrictAndBranch = (routingNumber) => {
    if (typeof routingNumber !== "string") {
      console.error("Invalid routingNumber type");
      return null;
    }

    let trimmedRoutingNumber = routingNumber.slice(0, -1);

    if (trimmedRoutingNumber.length < 8) {
      console.error("Invalid trimmedRoutingNumber length");
      return null;
    }

    const bankCode = trimmedRoutingNumber.slice(0, 3);
    const districtCode = trimmedRoutingNumber.slice(3, 5);
    const branchCode = trimmedRoutingNumber.slice(5);

    const bank = BankData.banks.find((bank) => bank.bankCode === bankCode);

    if (!bank) {
      console.error("Bank not found");
      return null;
    }

    const district = bank.districts.find(
      (district) => district.districtCode === districtCode
    );

    if (!district) {
      console.error("District not found");
      return null;
    }

    const branch = district.branches.find(
      (branch) => branch.branchCode === branchCode
    );

    if (!branch) {
      console.error("Branch not found");
      return null;
    }

    return {
      bankName: bank.name,
      districtName: district.name,
      branchName: branch.name,
      routingNumber,
    };
  };

  const { routingNumber } = JSON.parse(event.body);

  if (!routingNumber) {
    console.log("No routing number provided.");
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No routing number provided." }),
    };
  }

  const result = findBankDistrictAndBranch(routingNumber);

  if (!result) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Bank information not found for the given routing number.",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: "success",
      bankDetails: result,
    }),
  };
};
