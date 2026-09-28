import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Chechout from "./pages/Checkout";
import Sucess from "./pages/Success";


function App() {

  return (
      <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/checkout" element={<Chechout />} />
      <Route path="/success" element={<Sucess />} />
      
    </Routes>
    
    </BrowserRouter>
  );

}

export default App;
