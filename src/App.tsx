import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Link,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./features/auth/provider";
import { RequirePermission } from "./features/auth/RequirePermission";
const AuthPage = lazy(() => import("./features/auth/Pages"));
const AuthCallback = lazy(() =>
  import("./features/auth/Pages").then((module) => ({
    default: module.AuthCallback,
  })),
);
import { CommerceProvider } from "./features/commerce/Provider";
const Checkout = lazy(() => import("./features/commerce/Checkout"));
const Orders = lazy(() => import("./features/commerce/Orders"));
import { Layout } from "./app/Layout";
import Home from "./app/Home";
import { Loading } from "./components/ui/Feedback";
const CatalogPage = lazy(() => import("./features/catalog/Pages"));
const BicyclesPage = lazy(() => import("./features/catalog/Bicycles"));
const ComparePage = lazy(() => import("./features/compare"));
const GaragePage = lazy(() => import("./features/garage/Page"));
import "./index.css";
const Configurator = lazy(() => import("./features/configurator/Page"));
const Admin = lazy(() => import("./features/admin/Page"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
function LegacyRedirect() {
  const hash = location.hash;
  if (hash.startsWith("#/modelo/"))
    return (
      <Navigate
        replace
        to={`/componentes/${encodeURIComponent(hash.slice(9))}`}
      />
    );
  return <Home />;
}
const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: (
      <div className="content">
        <h1>Esta vista no está disponible</h1>
        <p>Vuelve al catálogo para continuar.</p>
        <Link to="/componentes">Abrir catálogo</Link>
      </div>
    ),
    children: [
      { path: "/", element: <LegacyRedirect /> },
      { path: "/componentes/:slug?", element: <CatalogPage /> },
      { path: "/catalogo", element: <Navigate replace to="/componentes" /> },
      { path: "/bicicletas", element: <BicyclesPage /> },
      { path: "/comparar", element: <ComparePage /> },
      { path: "/comprar", element: <Checkout /> },
      { path: "/mis-pedidos", element: <Orders /> },
      { path: "/entrar", element: <AuthPage mode="login" /> },
      { path: "/registro", element: <AuthPage mode="register" /> },
      { path: "/recuperar", element: <AuthPage mode="recover" /> },
      { path: "/auth/callback", element: <AuthCallback /> },
      { path: "/nueva-contrasena", element: <AuthPage mode="password" /> },
      {
        path: "/mis-bicicletas",
        element: (
          <RequirePermission permission="builds.read_own">
            <GaragePage />
          </RequirePermission>
        ),
      },
      {
        path: "/configurador/:buildId?",
        element: (
          <RequirePermission permission="configurator.use">
            <Suspense fallback={<Loading label="Preparando configurador" />}>
              <Configurator />
            </Suspense>
          </RequirePermission>
        ),
      },
      {
        path: "/administracion/:tab?",
        element: (
          <Suspense fallback={<Loading />}>
            <Admin />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <div className="content narrow">
            <p className="eyebrow">404 / Fuera de ruta</p>
            <h1>Este camino no existe.</h1>
            <Link className="button dark" to="/componentes">
              Volver al catálogo
            </Link>
          </div>
        ),
      },
    ],
  },
]);
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CommerceProvider>
          <RouterProvider router={router} />
        </CommerceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
