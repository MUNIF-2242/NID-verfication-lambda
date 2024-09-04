import React from "react";
import AddBank from "./pages/AddBank";
import BankDetails from "./pages/BankDetails";
import "./App.css"; // Assuming styles are in App.css

const App = () => {
  return (
    <div className="flex-container">
      <BankDetails />
      <AddBank />
    </div>
  );
};

export default App;
