import React from "react";
import { Routes, Route } from "react-router-dom";
import routes from "./components/routes/routes";
import { AppWrapper } from "./components/common/PageMeta";

const App: React.FC = () => {
  return (
    <AppWrapper>
      <Routes>
        {routes.map((route, index) => (
          <Route
            key={`${route.key}-${index}`}
            path={route.path}
            element={route.element}
          />
        ))}
      </Routes>
    </AppWrapper>
  );
};

export default App;
