import React from "react";
import AddBank from "./pages/AddBank";
import BankDetails from "./pages/BankDetails";
import "./App.css"; // Assuming styles are in App.css
import BranchReport from "./pages/BranchReport";

const App = () => {
  return (
    <div className="flex-container">
      <BankDetails />
      <AddBank />
      <BranchReport />
    </div>
  );
};

export default App;
