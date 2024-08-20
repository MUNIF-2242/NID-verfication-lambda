const AWS = require("aws-sdk");
const { Buffer } = require("buffer");
require("dotenv").config(); // Ensure environment variables are loaded

const textract = new AWS.Textract();

exports.handler = async (event) => {
  const { imageUrl } = JSON.parse(event.body);

  if (!imageUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No image URL provided." }),
    };
  }

  const params = {
    DocumentPages: [
      {
        S3Object: {
          Bucket: process.env.YOUR_S3_BUCKET_NAME,
          Name: imageUrl.split("/").pop(),
        },
      },
    ],
  };

  try {
    const response = await textract.analyzeID(params).promise();
    const identityDocumentFields =
      response.IdentityDocuments[0].IdentityDocumentFields;

    let mrzCodeText = null;
    for (let field of identityDocumentFields) {
      if (field?.Type?.Text === "MRZ_CODE") {
        let mrzCodeFull = field?.ValueDetection?.Text;
        console.log("mrzCodeText" + mrzCodeFull);
        if (mrzCodeFull) {
          const mrzLines = mrzCodeFull.split("\n");
          const mrzLastLine = mrzLines[mrzLines.length - 1];
          mrzCodeText = mrzLastLine;
          break;
        }
      }
    }

    if (mrzCodeText) {
      const result = validateMRZ(mrzCodeText);

      // Extract all MRZ fields
      const mrzFields = extractMRZFields(mrzCodeText);

      // Use only the required fields for response
      const responseData = getRequiredFields(mrzFields);

      return {
        statusCode: 200,
        body: JSON.stringify({
          responseData,
          passportVerificationStatus: result.isPassportValid,
        }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "MRZ code not found." }),
      };
    }
  } catch (error) {
    console.error("Textract error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "An error occurred while analyzing the document.",
      }),
    };
  }
};

const formatDate = (yyMMdd) => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const year = parseInt(yyMMdd.substring(0, 2), 10);
  const month = parseInt(yyMMdd.substring(2, 4), 10) - 1;
  const day = parseInt(yyMMdd.substring(4, 6), 10);

  const fullYear = year >= 50 ? 1900 + year : 2000 + year;
  return `${day} ${monthNames[month]} ${fullYear}`;
};

const getCharacterValue = (char) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  if (char >= "0" && char <= "9") {
    return parseInt(char);
  } else if (char >= "A" && char <= "Z") {
    return alphabet.indexOf(char) + 10;
  } else {
    return 0; // Placeholder < is treated as 0
  }
};

const calculateCheckDigit = (input) => {
  const weights = [7, 3, 1];
  let sum = 0;

  for (let i = 0; i < input.length; i++) {
    const value = getCharacterValue(input[i]);
    sum += value * weights[i % 3];
  }

  return sum % 10;
};

const parseDate = (yyMMdd) => {
  const year = parseInt(yyMMdd.substring(0, 2), 10);
  const month = parseInt(yyMMdd.substring(2, 4), 10) - 1;
  const day = parseInt(yyMMdd.substring(4, 6), 10);

  const fullYear = year >= 50 ? 1900 + year : 2000 + year;

  return new Date(fullYear, month, day);
};

const extractMRZFields = (mrz) => {
  return {
    passportNumber: mrz.substring(0, 9),
    passportNumberCheckDigit: parseInt(mrz[9]),
    birthDate: mrz.substring(13, 19),
    birthDateCheckDigit: parseInt(mrz[19]),
    expirationDate: mrz.substring(21, 27),
    expirationDateCheckDigit: parseInt(mrz[27]),
    personalNumber: mrz.substring(28, 42),
    personalNumberCheckDigit: parseInt(mrz[42]),
    finalCheckDigit: parseInt(mrz[43]),
  };
};

const getRequiredFields = (mrzFields) => {
  return {
    passportNumber: mrzFields.passportNumber,
    birthDate: formatDate(mrzFields.birthDate),
    expirationDate: formatDate(mrzFields.expirationDate),
    personalNumber: mrzFields.personalNumber.substring(0, 10),
  };
};

const validateMRZ = (mrz) => {
  console.log("ValidateMRZ" + mrz);
  if (!mrz) {
    // console.error("MRZ code is null or undefined");
    return {
      isPassportNumberValid: false,
      isBirthDateValid: false,
      isExpirationDateValid: false,
      isPersonalNumberValid: false,
      isFinalCheckDigitValid: false,
      isExpirationDateNotExpired: false,
      isPassportValid: false,
    };
  }
  const {
    passportNumber,
    passportNumberCheckDigit,
    birthDate,
    birthDateCheckDigit,
    expirationDate,
    expirationDateCheckDigit,
    personalNumber,
    personalNumberCheckDigit,
    finalCheckDigit,
  } = extractMRZFields(mrz);

  const isPassportNumberValid =
    calculateCheckDigit(passportNumber) === passportNumberCheckDigit;
  const isBirthDateValid =
    calculateCheckDigit(birthDate) === birthDateCheckDigit;
  const isExpirationDateValid =
    calculateCheckDigit(expirationDate) === expirationDateCheckDigit;
  const isPersonalNumberValid =
    calculateCheckDigit(personalNumber) === personalNumberCheckDigit;

  const expirationDateObj = parseDate(expirationDate);
  const currentDate = new Date();
  const isExpirationDateNotExpired = expirationDateObj >= currentDate;

  const combined =
    passportNumber +
    passportNumberCheckDigit +
    birthDate +
    birthDateCheckDigit +
    expirationDate +
    expirationDateCheckDigit +
    personalNumber +
    personalNumberCheckDigit;
  const isFinalCheckDigitValid =
    calculateCheckDigit(combined) === finalCheckDigit;

  const isPassportValid =
    isPassportNumberValid &&
    isBirthDateValid &&
    isExpirationDateValid &&
    isPersonalNumberValid &&
    isFinalCheckDigitValid &&
    isExpirationDateNotExpired;

  return {
    isPassportNumberValid,
    isBirthDateValid,
    isExpirationDateValid,
    isPersonalNumberValid,
    isFinalCheckDigitValid,
    isExpirationDateNotExpired,
    isPassportValid,
  };
};
