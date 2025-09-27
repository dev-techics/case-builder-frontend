import { RouterProvider } from "react-router";
import routes from "./routes/AppRoutes";

const App: React.FC = () => <RouterProvider router={routes} />;

export default App;
