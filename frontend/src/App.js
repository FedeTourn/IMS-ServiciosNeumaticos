import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Paginas
import InicioPage from './pages/Inicio/InicioPage';
import LoginPage from './pages/Login/LoginPage';
import ConstructionPage from './pages/ConstructionPage';
import Layout from './components/Layout/Layout';

// Rutas de Configuracion
import ConfigurationPage from './pages/Configuration/ConfigurationPage';
import UserListPage from './pages/Configuration/UserListPage';
import UpdateUserPage from './pages/Configuration/UpdateUserPage';
import CreateUserPage from './pages/Configuration/CreateUserPage';
import PriceMatrixPage from './pages/Configuration/PriceMatrixPage';

// Rutas del cliente
import ClientsPage from './pages/Clients/ClientsPage';
import CreateClientPage from './pages/Clients/CreateClientPage';
import UpdateClientPage from './pages/Clients/UpdateClientPage';

// Rutas del producto
import ProductsPage from './pages/Products/ProductsPage';
//import RegisterReceptionPage from './pages/Products/RegisterReceptionPage';
import UpdateProductPage from './pages/Products/UpdateProductPage';
import ProductTypesPage from './pages/Configuration/ProductTypesPage';
import ProductModelsPage from './pages/Configuration/ProductModelsPage';
import StateTransitionsPage from './pages/Configuration/StateTransitionsPage';

// Rutas de Comprobantes de Recepcion
import RegisterReceiptPage from './pages/Receipts/RegisterReceiptPage';
import ReceiptsPage from './pages/Receipts/ReceiptsPage';
import UpdateReceiptPage from './pages/Receipts/UpdateReceiptPage';

// Rutas Ordenes de Reparacion
import CreateRepairOrderPage from './pages/RepairOrders/CreateRepairOrderPage';
import RepairOrdersPage from './pages/RepairOrders/RepairOrdersPage';
import UpdateRepairOrderPage from './pages/RepairOrders/UpdateRepairOrderPage';


// Componente que envuelve la lógica para rutas privadas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <div className="text-lg font-semibold text-blue-600 animate-pulse">
          Cargando autenticación...
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirige al login
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      {/* Contenedor principal con Tailwind: min-h-screen asegura que el fondo cubra todo */}
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route 
            path="/*" 
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path='/Inicio' element={<InicioPage />}/>

                    {/* --- GESTIÓN DE CLIENTES --- */}
                    <Route path="/clientes" element={<ClientsPage />} /> 
                    <Route path="/crear-cliente" element={<CreateClientPage />} />
                    <Route path="/modificar-cliente/:id_cliente" element={<UpdateClientPage />} />
                    
                    {/* --- GESTIÓN DE PRODUCTOS (VÁLVULAS) --- */}
                    <Route path="/productos-reparar" element={<ProductsPage />} />
                    <Route path="/producto/:id_producto" element={<UpdateProductPage />} />
                    {/* <Route path="/registrar-recepcion" element={<RegisterReceptionPage />} /> */}

                    {/* --- CONFIGURACIÓN --- */}
                    <Route path="/configuracion" element={<ConfigurationPage />} /> 
                    <Route path="/configuracion/usuarios" element={<UserListPage />} />
                    <Route path="/configuracion/alta-usuario" element={<CreateUserPage />} />
                    <Route path="/configuracion/modificar-usuario/:id_user" element={<UpdateUserPage />} />
                    <Route path="/configuracion/tipos" element={<ProductTypesPage />} />
                    <Route path="/configuracion/modelos" element={<ProductModelsPage />} />
                    <Route path="/configuracion/transiciones" element={<StateTransitionsPage />} />
                    <Route path="/configuracion/precio-productos" element={<PriceMatrixPage />} />

                    {/* --- PROCESOS ADMINISTRATIVOS --- */}
                    {/*-- RECEPCIONES --*/}
                    <Route path="/registrar-recepcion" element={<RegisterReceiptPage />} />
                    <Route path="/recepciones" element={<ReceiptsPage />} />
                    <Route path="/recepcion/:id_comprobante" element={<UpdateReceiptPage />} />

                    {/*-- ORDENES DE REPARACION --*/}
                    <Route path="/crear-orden" element={<CreateRepairOrderPage />} />
                    <Route path="/ordenes-reparacion" element={<RepairOrdersPage />} />
                    <Route path="/ordenes-reparacion/:id_orden" element={<UpdateRepairOrderPage />} />



                    <Route path="/estados-cuenta" element={<ConstructionPage />} />

                    <Route path="*" element={<Navigate to="/Inicio" replace />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/Inicio" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;