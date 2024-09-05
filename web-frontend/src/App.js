// src/App.js or your main routing file
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import BankInfo from "./pages/BankInfo";

import BranchInfo from "./pages/BranchInfo";

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<BankInfo />} />
      <Route path="/branch-info" element={<BranchInfo />} />
    </Routes>
  </Router>
);

export default App;
