import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { publicRoutes, signedRoutes } from "./routes/Routes";
import Header from "./components/header/Header";
import AuthPage from "./pages/auth/Auth";

const Routing = () => {
  const isAuth = true;
  return (
    <Router basename="/live-articles">
      <Header />
      <Routes>
        {isAuth &&
          signedRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.component />}
            />
          ))}
        {publicRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<route.component />}
          />
        ))}
        <Route path="*" element={<AuthPage />} />
      </Routes>
    </Router>
  );
};

export default Routing;
