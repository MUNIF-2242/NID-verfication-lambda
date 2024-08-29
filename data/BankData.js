const BankData = {
  banks: [
    /*STANDARD CHARTERED BANK START*/
    {
      name: "Standard Chartered Bank",
      bankCode: "215",
      districts: [
        {
          name: "Bogura",
          districtCode: "10",
          branches: [{ name: "Bogura", branchCode: "037" }],
        },
        {
          name: "Chattogram",
          districtCode: "15",
          branches: [
            { name: "Chattogram Main", branchCode: "214" },
            { name: "Nasirabad", branchCode: "553" },
          ],
        },
        {
          name: "Dhaka",
          districtCode: "26",
          branches: [
            { name: "Dhanmondi", branchCode: "124" },
            { name: "Gulshan", branchCode: "172" },
            { name: "Gulshan North", branchCode: "190" },
            { name: "Kawran Bazar", branchCode: "253" },
            { name: "Savar", branchCode: "409" },
          ],
        },
        {
          name: "Dhaka",
          districtCode: "27",
          branches: [{ name: "Motijheel", branchCode: "424" }],
        },
        {
          name: "Khulna",
          districtCode: "47",
          branches: [{ name: "Khulna", branchCode: "154" }],
        },
        {
          name: "Narayanganj",
          districtCode: "67",
          branches: [{ name: "Narayanganj", branchCode: "118" }],
        },
        {
          name: "Sylhet",
          districtCode: "91",
          branches: [{ name: "Sylhet", branchCode: "367" }],
        },
      ],
    },
    /*STANDARD CHARTERED BANK END*/

    //Not started
    {
      name: "Habib Bank",
      bankCode: "110",
      districts: [
        {
          name: "Chattogram",
          districtCode: "15",
          branches: [{ name: "Chittagong", branchCode: "454" }],
        },
        // ... more districts
      ],
    },
    // ... more banks

    {
      name: "City Bank",
      bankCode: "225",
      districts: [
        {
          name: "Barishal",
          districtCode: "06",
          branches: [
            {
              name: "Barisal",
              branchCode: "028",
            },
          ],
        },
        {
          name: "Bogura",
          districtCode: "10",
          branches: [
            {
              name: "Bogra",
              branchCode: "037",
            },
            {
              name: "Sherpur",
              branchCode: "274",
            },
          ],
        },
        {
          name: "Brahmanbaria",
          districtCode: "12",
          branches: [
            {
              name: "Brahmanbaria",
              branchCode: "043",
            },
          ],
        },
        {
          name: "Chandpur",
          districtCode: "13",
          branches: [
            {
              name: "Chandpur",
              branchCode: "031",
            },
            {
              name: "Haziganj",
              branchCode: "088",
            },
            {
              name: "Kachua",
              branchCode: "091",
            },
          ],
        },
        {
          name: "Chapai Nawabganj",
          districtCode: "70",
          branches: [
            {
              name: "Chapai Nawabganj",
              branchCode: "025",
            },
          ],
        },
        {
          name: "Chattogram",
          districtCode: "15",
          branches: [
            {
              name: "Agrabad",
              branchCode: "013",
            },
            {
              name: "Andarkilla",
              branchCode: "046",
            },
            {
              name: "Bandartila",
              branchCode: "094",
            },
            {
              name: "Bhatiary Agri",
              branchCode: "122",
            },
            {
              name: "Chawkbazar",
              branchCode: "193",
            },
            {
              name: "Jubilee Road",
              branchCode: "364",
            },
            {
              name: "Kadamtali",
              branchCode: "373",
            },
            {
              name: "Khatunganj",
              branchCode: "427",
            },
            {
              name: "Lohagara",
              branchCode: "467",
            },
            {
              name: "OR Nizam Road",
              branchCode: "580",
            },
            {
              name: "Pahartali",
              branchCode: "592",
            },
            {
              name: "Patherhat",
              branchCode: "613",
            },
            {
              name: "Probartak",
              branchCode: "632",
            },
            {
              name: "Satkania",
              branchCode: "706",
            },
          ],
        },
        {
          name: "Cox's Bazar",
          districtCode: "22",
          branches: [
            {
              name: "Cox's Bazar",
              branchCode: "025",
            },
          ],
        },
        {
          name: "Cumilla",
          districtCode: "19",
          branches: [
            {
              name: "Chauddagram",
              branchCode: "106",
            },
            {
              name: "Comilla",
              branchCode: "115",
            },
            {
              name: "Daulatganj",
              branchCode: "154",
            },
          ],
        },
        {
          name: "Dhaka",
          districtCode: "26",
          branches: [
            {
              name: "Ashulia",
              branchCode: "022",
            },
            {
              name: "Banani",
              branchCode: "043",
            },
            {
              name: "Bangabandhu Avenue",
              branchCode: "043",
            },
            {
              name: "Dhaka New Market",
              branchCode: "352",
            },
            {
              name: "Dhanmondi",
              branchCode: "118",
            },
            {
              name: "DSE Nikunja",
              branchCode: "127",
            },
            {
              name: "Foreign Exchange",
              branchCode: "232",
            },
            {
              name: "Gulshan",
              branchCode: "172",
            },
            {
              name: "Gulshan Avenue",
              branchCode: "173",
            },
            {
              name: "Imamganj",
              branchCode: "280",
            },
            {
              name: "Islamic Banking",
              branchCode: "286",
            },
            {
              name: "Islampur Road",
              branchCode: "298",
            },
            {
              name: "Jatrabari Agri",
              branchCode: "323",
            },
            {
              name: "Johnson Road",
              branchCode: "325",
            },
            {
              name: "Joypara Agri",
              branchCode: "329",
            },
            {
              name: "Kawran Bazar",
              branchCode: "253",
            },
            {
              name: "Mirpur",
              branchCode: "298",
            },
            {
              name: "Moghbazar",
              branchCode: "418",
            },
            {
              name: "Mouchak",
              branchCode: "436",
            },
            {
              name: "Nawabganj",
              branchCode: "469",
            },
            {
              name: "Nawabpur",
              branchCode: "472",
            },
            {
              name: "Pallabi",
              branchCode: "358",
            },
            {
              name: "Posta",
              branchCode: "529",
            },
            {
              name: "Pragati Sarani",
              branchCode: "370",
            },
            {
              name: "Principal Office",
              branchCode: "535",
            },
            {
              name: "Sadarghat",
              branchCode: "592",
            },
            {
              name: "Savar Agri",
              branchCode: "410",
            },
            {
              name: "Shyamoli",
              branchCode: "430",
            },
            {
              name: "Urdu Road",
              branchCode: "679",
            },
            {
              name: "Uttara",
              branchCode: "463",
            },
            {
              name: "VIP Road",
              branchCode: "685",
            },
            {
              name: "Zinzira",
              branchCode: "709",
            },
          ],
        },
        {
          name: "Dinajpur",
          districtCode: "28",
          branches: [
            {
              name: "Dinajpur",
              branchCode: "067",
            },
          ],
        },
        {
          name: "Faridpur",
          districtCode: "29",
          branches: [
            {
              name: "Alfadanga",
              branchCode: "004",
            },
            {
              name: "Faridpur",
              branchCode: "052",
            },
          ],
        },
        {
          name: "Feni",
          districtCode: "30",
          branches: [
            {
              name: "Feni",
              branchCode: "052",
            },
          ],
        },
        {
          name: "Gaibandha",
          districtCode: "32",
          branches: [
            {
              name: "Gobindaganj",
              branchCode: "058",
            },
          ],
        },
        {
          name: "Gazipur",
          districtCode: "33",
          branches: [
            {
              name: "Gazipur Agri",
              branchCode: "053",
            },
            {
              name: "Tongi",
              branchCode: "163",
            },
          ],
        },
        {
          name: "Habiganj",
          districtCode: "36",
          branches: [
            {
              name: "Habiganj Agri",
              branchCode: "062",
            },
          ],
        },
        {
          name: "Jamalpur",
          districtCode: "39",
          branches: [
            {
              name: "Jamalpur Agri",
              branchCode: "086",
            },
          ],
        },
        {
          name: "Jessore",
          districtCode: "41",
          branches: [
            {
              name: "Benapole",
              branchCode: "028",
            },
            {
              name: "Jessore",
              branchCode: "094",
            },
          ],
        },
        {
          name: "Khulna",
          districtCode: "47",
          branches: [
            {
              name: "Khulna",
              branchCode: "154",
            },
          ],
        },
        {
          name: "Kishoreganj",
          districtCode: "48",
          branches: [
            {
              name: "Bhairab Bazar",
              branchCode: "022",
            },
            {
              name: "Kishoreganj Agri",
              branchCode: "068",
            },
          ],
        },
        {
          name: "Kushtia",
          districtCode: "50",
          branches: [
            {
              name: "Kushtia",
              branchCode: "094",
            },
          ],
        },
        {
          name: "Lakshmipur",
          districtCode: "51",
          branches: [
            {
              name: "Lakshmipur",
              branchCode: "073",
            },
          ],
        },
        {
          name: "Manikganj",
          districtCode: "56",
          branches: [
            {
              name: "Manikganj",
              branchCode: "061",
            },
          ],
        },
        {
          name: "Moulvibazar",
          districtCode: "58",
          branches: [
            {
              name: "Moulvibazar",
              branchCode: "118",
            },
            {
              name: "Sreemangal",
              branchCode: "172",
            },
          ],
        },
        {
          name: "Munshiganj",
          districtCode: "59",
          branches: [
            {
              name: "Rekabi Bazar",
              branchCode: "121",
            },
          ],
        },
        {
          name: "Mymensingh",
          districtCode: "61",
          branches: [
            {
              name: "Mymensingh",
              branchCode: "175",
            },
          ],
        },
        {
          name: "Narayanganj",
          districtCode: "67",
          branches: [
            {
              name: "Nitaiganj",
              branchCode: "127",
            },
          ],
        },
        {
          name: "Narsingdi",
          districtCode: "68",
          branches: [
            {
              name: "Madhabdi",
              branchCode: "067",
            },
            {
              name: "Narsingdi",
              branchCode: "085",
            },
          ],
        },
        {
          name: "Natore",
          districtCode: "69",
          branches: [
            {
              name: "Natore Agri",
              branchCode: "111",
            },
          ],
        },
        {
          name: "Nilphamari",
          districtCode: "73",
          branches: [
            {
              name: "Syedpur",
              branchCode: "079",
            },
          ],
        },
        {
          name: "Noakhali",
          districtCode: "75",
          branches: [
            {
              name: "Chowmuhani",
              branchCode: "067",
            },
            {
              name: "Maijdee Agri",
              branchCode: "158",
            },
          ],
        },
        {
          name: "Pabna",
          districtCode: "76",
          branches: [
            {
              name: "Pabna",
              branchCode: "178",
            },
          ],
        },
        {
          name: "Rajshahi",
          districtCode: "81",
          branches: [
            {
              name: "Rajshahi",
              branchCode: "193",
            },
          ],
        },
        {
          name: "Rangpur",
          districtCode: "85",
          branches: [
            {
              name: "Rangpur",
              branchCode: "145",
            },
          ],
        },
        {
          name: "Satkhira",
          districtCode: "87",
          branches: [
            {
              name: "Satkhira",
              branchCode: "109",
            },
          ],
        },
        {
          name: "Sirajganj",
          districtCode: "88",
          branches: [
            {
              name: "Sirajganj",
              branchCode: "187",
            },
          ],
        },
        {
          name: "Sunamganj",
          districtCode: "90",
          branches: [
            {
              name: "Jagannathpur",
              branchCode: "049",
            },
          ],
        },
        {
          name: "Sylhet",
          districtCode: "91",
          branches: [
            {
              name: "Amberkhana",
              branchCode: "004",
            },
            {
              name: "Bandar Bazar",
              branchCode: "355",
            },
            {
              name: "Beanibazar",
              branchCode: "031",
            },
            {
              name: "Bishwanath",
              branchCode: "043",
            },
            {
              name: "Dhakadakshin",
              branchCode: "130",
            },
            {
              name: "Zindabazar",
              branchCode: "415",
            },
          ],
        },
        {
          name: "Tangail",
          districtCode: "93",
          branches: [
            {
              name: "Tangail",
              branchCode: "229",
            },
          ],
        },
      ],
    },
  ],
};

module.exports = BankData;
