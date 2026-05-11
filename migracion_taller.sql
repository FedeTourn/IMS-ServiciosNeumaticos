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
-- Dumping data for table `CategoriaCliente`
--

LOCK TABLES `CategoriaCliente` WRITE;
/*!40000 ALTER TABLE `CategoriaCliente` DISABLE KEYS */;
INSERT INTO `CategoriaCliente` VALUES (1,'CATEGORIA 1'),(2,'CATEGORIA 2'),(3,'CATEGORIA 3'),(4,'CATEGORIA 4'),(5,'CATEGORIA 5');
/*!40000 ALTER TABLE `CategoriaCliente` ENABLE KEYS */;
UNLOCK TABLES;

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
  `categoria` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `cuit` (`cuit`),
  KEY `categoria` (`categoria`),
  CONSTRAINT `Cliente_ibfk_1` FOREIGN KEY (`categoria`) REFERENCES `CategoriaCliente` (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Cliente`
--

LOCK TABLES `Cliente` WRITE;
/*!40000 ALTER TABLE `Cliente` DISABLE KEYS */;
INSERT INTO `Cliente` VALUES (4,'DIEGO LISA','FRANCK','0000000','',1,1,'2025-11-01 00:14:02'),(5,'EL NORTE','SANTA FE, SANTA FE','1234567',NULL,1,1,'2025-11-06 15:43:05');
/*!40000 ALTER TABLE `Cliente` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `EstadoProducto`
--

LOCK TABLES `EstadoProducto` WRITE;
/*!40000 ALTER TABLE `EstadoProducto` DISABLE KEYS */;
INSERT INTO `EstadoProducto` VALUES (2,'EN REPARACION'),(4,'ENTREGADO'),(6,'LIBRE'),(5,'NO REPARABLE'),(1,'RECIBIDO'),(3,'REPARADO');
/*!40000 ALTER TABLE `EstadoProducto` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `HistorialEstados`
--

LOCK TABLES `HistorialEstados` WRITE;
/*!40000 ALTER TABLE `HistorialEstados` DISABLE KEYS */;
/*!40000 ALTER TABLE `HistorialEstados` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `ModeloProducto`
--

LOCK TABLES `ModeloProducto` WRITE;
/*!40000 ALTER TABLE `ModeloProducto` DISABLE KEYS */;
INSERT INTO `ModeloProducto` VALUES (1,'VOLVO',1),(2,'2 CIRCUITOS',1),(3,'ADER',2);
/*!40000 ALTER TABLE `ModeloProducto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PrecioPorCategoria`
--

DROP TABLE IF EXISTS `PrecioPorCategoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PrecioPorCategoria` (
  `id_modelo` int NOT NULL,
  `id_categoria` int NOT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_modelo`,`id_categoria`),
  KEY `id_categoria` (`id_categoria`),
  CONSTRAINT `PrecioPorCategoria_ibfk_1` FOREIGN KEY (`id_modelo`) REFERENCES `ModeloProducto` (`id_modelo`),
  CONSTRAINT `PrecioPorCategoria_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `CategoriaCliente` (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PrecioPorCategoria`
--

LOCK TABLES `PrecioPorCategoria` WRITE;
/*!40000 ALTER TABLE `PrecioPorCategoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `PrecioPorCategoria` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`id_producto`),
  KEY `modelo` (`modelo`),
  KEY `estado` (`estado`),
  KEY `id_cliente` (`id_cliente`),
  CONSTRAINT `Producto_ibfk_2` FOREIGN KEY (`modelo`) REFERENCES `ModeloProducto` (`id_modelo`),
  CONSTRAINT `Producto_ibfk_3` FOREIGN KEY (`estado`) REFERENCES `EstadoProducto` (`id_estado`),
  CONSTRAINT `Producto_ibfk_4` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente` (`id_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Producto`
--

LOCK TABLES `Producto` WRITE;
/*!40000 ALTER TABLE `Producto` DISABLE KEYS */;
INSERT INTO `Producto` VALUES (1,1,'2025-11-01 17:17:19','2025-11-01 17:17:19',NULL,NULL,1,NULL,4,NULL),(3,3,'2025-11-01 17:20:42',NULL,NULL,NULL,1,NULL,4,NULL),(4,2,'2025-11-02 00:00:00','2025-11-02 23:27:38',NULL,'',6,NULL,4,NULL);
/*!40000 ALTER TABLE `Producto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Role`
--

DROP TABLE IF EXISTS `Role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Role` (
  `id_role` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id_role`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Role`
--

LOCK TABLES `Role` WRITE;
/*!40000 ALTER TABLE `Role` DISABLE KEYS */;
INSERT INTO `Role` VALUES (1,'Administrador'),(3,'Administrativo'),(4,'Operario'),(2,'Tecnico');
/*!40000 ALTER TABLE `Role` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `TelefonoCliente`
--

LOCK TABLES `TelefonoCliente` WRITE;
/*!40000 ALTER TABLE `TelefonoCliente` DISABLE KEYS */;
INSERT INTO `TelefonoCliente` VALUES ('+543425422429',4,'NUMERO EMPLEADO'),('+5442555713',5,'ARIEL');
/*!40000 ALTER TABLE `TelefonoCliente` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `TipoProducto`
--

LOCK TABLES `TipoProducto` WRITE;
/*!40000 ALTER TABLE `TipoProducto` DISABLE KEYS */;
INSERT INTO `TipoProducto` VALUES (2,'DISTRIBUIDORA'),(1,'FRENO MANO'),(3,'PEDALERA');
/*!40000 ALTER TABLE `TipoProducto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `id_role` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `username` (`username`),
  KEY `id_role` (`id_role`),
  CONSTRAINT `User_ibfk_1` FOREIGN KEY (`id_role`) REFERENCES `Role` (`id_role`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,'Federico Tourn','admin','$2b$10$JTeMPpxA9Q5iYp5zqBshfeudz8smvpbCF5Ebak9W5vGm7qrjT2pSG',1,1,'2025-10-21 21:22:12','2025-10-21 21:22:12'),(2,'Maria Laura Pacini','lau','$2b$10$uCYX8q7kTl/.GZZx/qnLj.F1oz6Gcxz5H.91ZEiI07ys5WP4xsvIC',3,1,'2025-11-05 22:58:16','2025-11-05 22:58:16');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

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

-- Dump completed on 2026-05-05 19:06:44
