-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: tallerdb
-- ------------------------------------------------------
-- Server version	8.4.6

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `CategoriaCliente`
--

DROP TABLE IF EXISTS `CategoriaCliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CategoriaCliente` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) NOT NULL,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Cliente`
--

DROP TABLE IF EXISTS `Cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Cliente` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(100) DEFAULT NULL,
  `cuit` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `categoria` int NOT NULL DEFAULT '1',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `ultima_modificacion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `cuit` (`cuit`),
  KEY `categoria` (`categoria`),
  CONSTRAINT `Cliente_ibfk_1` FOREIGN KEY (`categoria`) REFERENCES `CategoriaCliente` (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ComprobanteRecepcion`
--

DROP TABLE IF EXISTS `ComprobanteRecepcion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ComprobanteRecepcion` (
  `id_comprobante` int NOT NULL AUTO_INCREMENT,
  `fecha_recepcion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ruta_imagen` varchar(255) DEFAULT NULL,
  `descripcion` text,
  `id_cliente` int NOT NULL,
  PRIMARY KEY (`id_comprobante`),
  KEY `fk_comprobante_cliente` (`id_cliente`),
  CONSTRAINT `fk_comprobante_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente` (`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `DiccionarioEstado`
--

DROP TABLE IF EXISTS `DiccionarioEstado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DiccionarioEstado` (
  `estado_origen` int NOT NULL,
  `estado_destino` int NOT NULL,
  PRIMARY KEY (`estado_origen`,`estado_destino`),
  KEY `fk_diccionario_estado_destino` (`estado_destino`),
  CONSTRAINT `fk_diccionario_estado_destino` FOREIGN KEY (`estado_destino`) REFERENCES `EstadoProducto` (`id_estado`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_diccionario_estado_origen` FOREIGN KEY (`estado_origen`) REFERENCES `EstadoProducto` (`id_estado`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `EstadoOrdenReparacion`
--

DROP TABLE IF EXISTS `EstadoOrdenReparacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EstadoOrdenReparacion` (
  `id_estado_orden` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id_estado_orden`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `EstadoPago`
--

DROP TABLE IF EXISTS `EstadoPago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EstadoPago` (
  `id_estado_pago` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id_estado_pago`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `EstadoProducto`
--

DROP TABLE IF EXISTS `EstadoProducto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EstadoProducto` (
  `id_estado` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `HistorialEstados`
--

DROP TABLE IF EXISTS `HistorialEstados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `HistorialEstados` (
  `id_historial` int NOT NULL,
  `fecha_cambio` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `producto` int DEFAULT NULL,
  `estado_anterior` int DEFAULT NULL,
  `estado_nuevo` int DEFAULT NULL,
  PRIMARY KEY (`id_historial`),
  KEY `producto` (`producto`),
  KEY `estado_anterior` (`estado_anterior`),
  KEY `estado_nuevo` (`estado_nuevo`),
  CONSTRAINT `HistorialEstados_ibfk_1` FOREIGN KEY (`producto`) REFERENCES `Producto` (`id_producto`),
  CONSTRAINT `HistorialEstados_ibfk_2` FOREIGN KEY (`estado_anterior`) REFERENCES `EstadoProducto` (`id_estado`),
  CONSTRAINT `HistorialEstados_ibfk_3` FOREIGN KEY (`estado_nuevo`) REFERENCES `EstadoProducto` (`id_estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `MedioPago`
--

DROP TABLE IF EXISTS `MedioPago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MedioPago` (
  `id_medio_pago` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `es_diferido` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_medio_pago`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ModeloProducto`
--

DROP TABLE IF EXISTS `ModeloProducto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ModeloProducto` (
  `id_modelo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `tipo` int DEFAULT NULL,
  PRIMARY KEY (`id_modelo`),
  KEY `tipo` (`tipo`),
  CONSTRAINT `ModeloProducto_ibfk_1` FOREIGN KEY (`tipo`) REFERENCES `TipoProducto` (`id_tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `OrdenReparacion`
--

DROP TABLE IF EXISTS `OrdenReparacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `OrdenReparacion` (
  `id_orden_reparacion` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_estado_orden` int NOT NULL,
  `importe_total` decimal(10,2) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  `observaciones` text,
  PRIMARY KEY (`id_orden_reparacion`),
  KEY `fk_orden_cliente` (`id_cliente`),
  KEY `fk_orden_estado` (`id_estado_orden`),
  CONSTRAINT `fk_orden_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente` (`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orden_estado` FOREIGN KEY (`id_estado_orden`) REFERENCES `EstadoOrdenReparacion` (`id_estado_orden`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Pago`
--

DROP TABLE IF EXISTS `Pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pago` (
  `id_pago` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_estado_pago` int NOT NULL,
  `id_medio_pago` int NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_pago` datetime NOT NULL,
  `numero_comprobante` varchar(100) DEFAULT NULL,
  `observaciones` text,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pago`),
  KEY `fk_pago_cliente` (`id_cliente`),
  KEY `fk_pago_estado` (`id_estado_pago`),
  KEY `fk_pago_medio` (`id_medio_pago`),
  CONSTRAINT `fk_pago_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente` (`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pago_estado` FOREIGN KEY (`id_estado_pago`) REFERENCES `EstadoPago` (`id_estado_pago`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pago_medio` FOREIGN KEY (`id_medio_pago`) REFERENCES `MedioPago` (`id_medio_pago`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `PrecioPorCategoria`
--

DROP TABLE IF EXISTS `PrecioPorCategoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PrecioPorCategoria` (
  `id_precio` int NOT NULL AUTO_INCREMENT,
  `id_modelo` int NOT NULL,
  `id_categoria` int NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `vigencia_desde` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `vigencia_hasta` timestamp NULL DEFAULT NULL,
  `vigente` tinyint GENERATED ALWAYS AS (if((`vigencia_hasta` is null),1,NULL)) VIRTUAL,
  PRIMARY KEY (`id_precio`),
  UNIQUE KEY `uq_precio_unico_vigente` (`id_modelo`,`id_categoria`,`vigente`),
  KEY `idx_modelo_categoria_vigencia` (`id_modelo`,`id_categoria`,`vigencia_desde`),
  KEY `fk_precio_categoria` (`id_categoria`),
  CONSTRAINT `fk_precio_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `CategoriaCliente` (`id_categoria`),
  CONSTRAINT `fk_precio_modelo` FOREIGN KEY (`id_modelo`) REFERENCES `ModeloProducto` (`id_modelo`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Producto`
--

DROP TABLE IF EXISTS `Producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Producto` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `modelo` int NOT NULL,
  `fecha_recepcion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_reparacion` timestamp NULL DEFAULT NULL,
  `fecha_entrega` timestamp NULL DEFAULT NULL,
  `observaciones` text,
  `estado` int DEFAULT NULL,
  `id_comprobante_recepcion` int DEFAULT NULL,
  `id_cliente` int DEFAULT NULL,
  `id_orden_reparacion` int DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_producto`),
  KEY `modelo` (`modelo`),
  KEY `estado` (`estado`),
  KEY `id_cliente` (`id_cliente`),
  KEY `fk_producto_comprobante` (`id_comprobante_recepcion`),
  KEY `fk_producto_orden_reparacion` (`id_orden_reparacion`),
  CONSTRAINT `fk_producto_comprobante` FOREIGN KEY (`id_comprobante_recepcion`) REFERENCES `ComprobanteRecepcion` (`id_comprobante`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_orden_reparacion` FOREIGN KEY (`id_orden_reparacion`) REFERENCES `OrdenReparacion` (`id_orden_reparacion`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Producto_ibfk_2` FOREIGN KEY (`modelo`) REFERENCES `ModeloProducto` (`id_modelo`),
  CONSTRAINT `Producto_ibfk_3` FOREIGN KEY (`estado`) REFERENCES `EstadoProducto` (`id_estado`),
  CONSTRAINT `Producto_ibfk_4` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente` (`id_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Rol`
--

DROP TABLE IF EXISTS `Rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `name` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TelefonoCliente`
--

DROP TABLE IF EXISTS `TelefonoCliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TelefonoCliente` (
  `telefono` varchar(20) NOT NULL,
  `id_cliente` int NOT NULL,
  `descripcion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`telefono`,`id_cliente`),
  KEY `id_cliente` (`id_cliente`),
  CONSTRAINT `TelefonoCliente_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente` (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TipoProducto`
--

DROP TABLE IF EXISTS `TipoProducto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TipoProducto` (
  `id_tipo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id_tipo`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Usuario`
--

DROP TABLE IF EXISTS `Usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `nombre_usuario` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `hash_contrasena` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `id_rol` int NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_modificacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`nombre_usuario`),
  KEY `id_role` (`id_rol`),
  CONSTRAINT `Usuario_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `Rol` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'tallerdb'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-20 21:19:52
