// This is a redirect component that just forwards to our HomePage component
import { Navigate } from "react-router-dom";

const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
