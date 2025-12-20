-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: mysql-2528755d-tecnicojoeltienda.l.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '690f6b91-d7a2-11f0-90d4-66a8dd51a7f1:1-47';

--
-- Table structure for table `administrador`
--

DROP TABLE IF EXISTS `administrador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrador` (
  `id_admin` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `clave` varchar(255) NOT NULL,
  `rol` enum('admin','super_admin') DEFAULT 'admin',
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  PRIMARY KEY (`id_admin`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrador`
--

LOCK TABLES `administrador` WRITE;
/*!40000 ALTER TABLE `administrador` DISABLE KEYS */;
INSERT INTO `administrador` VALUES (1,'Joel Ortiz','tecnicojoel','tecnicojoeltienda@gmail.com','$2b$10$yl/1qEy3bRCq/mmuqZ0VJeA72jjMGaD8FaOuU6lc2q23jr.8JuQXS','super_admin','activo');
/*!40000 ALTER TABLE `administrador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoria`
--

DROP TABLE IF EXISTS `categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria`
--

LOCK TABLES `categoria` WRITE;
/*!40000 ALTER TABLE `categoria` DISABLE KEYS */;
INSERT INTO `categoria` VALUES (1,'PCs','Computadoras de escritorio de alto rendimiento'),(2,'Laptops','Portátiles para trabajo, estudio y gaming'),(3,'Monitores','Pantallas LED, IPS y gamers de diferentes pulgadas'),(4,'Mouse','Ratones ópticos, inalámbricos y gamers'),(5,'Accesorios','Complementos tecnológicos para tu setup'),(6,'Sonido','Parlantes, audífonos y equipos de audio'),(7,'Tintas','Cartuchos y botellas de tinta para impresoras'),(8,'Licencias','Software y licencias originales'),(9,'Reacondicionados','Equipos reacondicionados con garantía'),(10,'Redes','Routers, cables y dispositivos de conexión'),(11,'Impresoras','Impresoras multifuncionales, láser y de inyección de tinta'),(12,'Componentes','Partes internas como procesadores, memorias RAM, discos y tarjetas gráficas'),(13,'Estabilizadores','Equipos eléctricos para proteger tus dispositivos de variaciones de voltaje');
/*!40000 ALTER TABLE `categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `dni` varchar(15) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `clave` varchar(255) NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `dni` (`dni`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codigo_descuento`
--

DROP TABLE IF EXISTS `codigo_descuento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codigo_descuento` (
  `id_codigo` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `porcentaje` decimal(5,2) NOT NULL,
  `max_usos` int NOT NULL DEFAULT '5',
  `usos_actuales` int NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_codigo`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_codigo` (`codigo`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codigo_descuento`
--

LOCK TABLES `codigo_descuento` WRITE;
/*!40000 ALTER TABLE `codigo_descuento` DISABLE KEYS */;
INSERT INTO `codigo_descuento` VALUES (1,'TECNICO5',5.00,5,0,1,'2025-12-06 23:45:10'),(2,'TECNICO10',10.00,5,0,1,'2025-12-06 23:45:10');
/*!40000 ALTER TABLE `codigo_descuento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_pedido`
--

DROP TABLE IF EXISTS `detalle_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_pedido` (
  `id_detalle_pedido` int NOT NULL AUTO_INCREMENT,
  `id_pedido` int NOT NULL,
  `id_producto` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) GENERATED ALWAYS AS ((`cantidad` * `precio_unitario`)) STORED,
  PRIMARY KEY (`id_detalle_pedido`),
  KEY `id_pedido` (`id_pedido`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `detalle_pedido_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedido` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `detalle_pedido_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_pedido`
--

LOCK TABLES `detalle_pedido` WRITE;
/*!40000 ALTER TABLE `detalle_pedido` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimiento_stock`
--

DROP TABLE IF EXISTS `movimiento_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_stock` (
  `id_movimiento` int NOT NULL AUTO_INCREMENT,
  `id_producto` int DEFAULT NULL,
  `tipo` enum('entrada','salida') NOT NULL,
  `cantidad` int NOT NULL,
  `descripcion` text,
  `fecha_movimiento` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_movimiento`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `movimiento_stock_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_stock`
--

LOCK TABLES `movimiento_stock` WRITE;
/*!40000 ALTER TABLE `movimiento_stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimiento_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedido`
--

DROP TABLE IF EXISTS `pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido` (
  `id_pedido` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `fecha_pedido` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('pendiente','enviado','cancelado','completado') DEFAULT 'pendiente',
  `total` decimal(10,2) DEFAULT '0.00',
  `codigo_descuento` varchar(50) DEFAULT NULL,
  `porcentaje_descuento` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `id_cliente` (`id_cliente`),
  CONSTRAINT `pedido_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedido`
--



LOCK TABLES `pedido` WRITE;
/*!40000 ALTER TABLE `pedido` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedido` ENABLE KEYS */;
UNLOCK TABLES;

-- Tabla para productos relacionados
CREATE TABLE IF NOT EXISTS `producto_relacionado` (
  `id_relacion` int NOT NULL AUTO_INCREMENT,
  `id_producto` int NOT NULL,
  `id_producto_relacionado` int NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_relacion`),
  KEY `idx_producto` (`id_producto`),
  KEY `idx_producto_relacionado` (`id_producto_relacionado`),
  UNIQUE KEY `unique_relacion` (`id_producto`, `id_producto_relacionado`),
  CONSTRAINT `fk_producto_principal` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`) ON DELETE CASCADE,
  CONSTRAINT `fk_producto_relacionado` FOREIGN KEY (`id_producto_relacionado`) REFERENCES `producto` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Índices para mejorar el rendimiento
CREATE INDEX idx_producto_relacionado_lookup ON producto_relacionado(id_producto, id_producto_relacionado);

--
-- Table structure for table `producto`
--

DROP TABLE IF EXISTS `producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `nombre_producto` varchar(150) NOT NULL,
  `descripcion` text,
  `especificaciones` text,
  `id_categoria` int DEFAULT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `stock_minimo` int DEFAULT '5',
  `en_promocion` enum('si','no') DEFAULT 'no',
  `estado` enum('disponible','agotado') DEFAULT 'disponible',
  PRIMARY KEY (`id_producto`),
  KEY `id_categoria` (`id_categoria`),
  CONSTRAINT `producto_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto`
--

LOCK TABLES `producto` WRITE;
/*!40000 ALTER TABLE `producto` DISABLE KEYS */;
INSERT INTO `producto` VALUES (1,'Laptop Lenovo LOQ 15IRX9 ','Pantalla15.6\" FHD IPS, Procesador Core i7-13650HX 2.6/4.9GHz RAM 12GB DDR5-4800MHz SSD 512GB Gráfica RTX 3050 6GB',NULL,2,3750.00,'/uploads/1762625824415-471901730.webp',5,2,'no','disponible'),(2,'Laptop Lenovo LOQ 15IAX9','Pantalla 15.6\" FHD IPS, Procesador Core i5-12450HX hasta 4.4GHz, RAM 8GB DDR5-4800MHz, SSD 512GB, Gráfica RTX 3050 6GB','Poner especificaciones: todo okey  estado: dispuesto ',2,3050.00,'/uploads/1762625991735-847867521.webp',5,0,'no','disponible'),(3,'Laptop Lenovo V15 G4 IRU ','Procesador Intel Core i7-1355U, RAM 8GB, SSD 512GB, Pantalla 15.6\" FHD ',NULL,2,2650.00,'/uploads/1762626115351-758984374.webp',5,0,'no','disponible'),(4,'Laptop Lenovo V15 G4 IRU','Pantalla 15.6\" FHD TN, Procesador Core i3-1315U 1.2 / 4.5GHz, RAM 8GB DDR4-3200MHz,  256GB SSD M.2 2242 PCIe 4.0x4 NVMe, Integrado Intel UHD Graphics',NULL,2,1430.00,'/uploads/1762626331816-503259970.webp',5,2,'no','disponible'),(5,'Laptop Lenovo Ideapad Slim 3 15ABR8 ','Procesador AMD Ryzen 7 5825U 1, RAM 6GB, 512GB SSD, Pantalla 15.6\" FHD',NULL,2,1890.00,'/uploads/1762626773684-320429690.webp',5,0,'no','disponible'),(6,'Monitor plano TEROS TE-1915S ','Pantalla 19.5\" HD+ Refresco TN 75Hz 5ms Conexión HDMI VGA Color negro','Segunda prueba: Especificaciones \nDisponible: claro que si \nEspecificación: si \nEspecificación: 1\nEspecificación: 2 ',3,260.00,'/uploads/T1.webp',5,2,'no','disponible'),(7,'Monitor plano TEROS TE-2130CS ','Pantalla 21.5\" FHD IPS, Refresco 100Hz 5ms, Conexión HDMI VGA, Color negro',NULL,3,260.00,'/uploads/1762634425881-354936067.webp',5,1,'no','disponible'),(8,'Monitor plano TEROS TE-2128S ','Pantalla 21.5\" FHD IPS, Refresco 100Hz 1ms, Conexión HDMI VGA, Color negro',NULL,3,270.00,'/uploads/1762636037802-402200631.webp',5,1,'no','disponible'),(9,'Monitor plano TEROS TE-2419CS ','Pantalla 24\" WUXGA IPS, Refresco 75Hz 5ms, Conexión HDMI VGA, Color negro',NULL,3,280.00,'/uploads/1762637473641-255846201.webp',5,0,'no','disponible'),(10,'Impresora Multifuncional de tinta HP Smart Tank 585','Impresión/Escaneo/Copia, Conexión Wi-Fi/Bluetooth LE/USB',NULL,11,670.00,'/uploads/1762637717715-907129384.webp',5,0,'no','disponible'),(11,'Impresora Multifuncional de tinta Epson EcoTank L3210','Imprime / Escanea / Copia, Conexión USB',NULL,11,698.00,'/uploads/1762637878053-440351945.webp',5,0,'no','disponible'),(12,'Impresora Multifuncional de tinta Epson L3250','Conexión USB de alta velocidad (compatible con USB 2.0)',NULL,11,780.00,'/uploads/I1.webp',3,1,'no','disponible'),(13,'Impresora Multifuncional de tinta Epson EcoTank L4360',' imprime/escanea/copia/Duplex, Conexión Wi-Fi/USB',NULL,11,930.00,'/uploads/1762638427049-446473471.webp',5,0,'no','disponible'),(14,'PC All-in-One Lenovo IdeaCentre 3 24ALC6','Pantalla 23.8\" FHD IPS, Procesador Ryzen 5 7430U 2.3/4.3G, RAM 16GB DDR4-3200',NULL,1,2199.00,'/uploads/1762639990777-945054464.webp',5,1,'no','disponible'),(15,'PC All-in-One Lenovo IdeaCentre 3 27ALC6 ','Pantalla 27\" FHD IPS, Procesador Ryzen 7 7730U 2.0/4.5GHz, RAM 16GB DDR4-3200',NULL,1,2470.00,'/uploads/1762642309208-435850849.webp',5,0,'no','disponible'),(16,'PC All-in-One Lenovo IdeaCentre 27IRH9 ','Pantalla 27\" FHD IPS, Procesador Core i5-13420H hasta 4.6GHz, RAM 16GB DDR5-5200',NULL,1,2590.00,'/uploads/1762642768683-574010259.webp',5,1,'no','disponible'),(17,'PC All-in-One HP CR0350LA','Pantalla 23.8” FHD IPS, Procesador Core i5 1334U Hasta 4.6GHz, RAM 8GB DDR4-3200M, Almacenamiento 512GB',NULL,1,2690.00,'/uploads/1762642833364-79644312.webp',5,0,'no','disponible'),(18,'Accesorio Cargador TEROS TE-70207W','USB-A USB-C, GaN, PD 65W,  Color blanco',NULL,5,20.00,'/uploads/1762642967924-369203668.webp',3,0,'no','disponible'),(19,'Accesorio Cable Poder Universal PC','Cable de alimentación  con enchufe de 3 clavijas a conector hembra de 3 ranuras\nConductor material : Aluminio recubierto de cobre\nTipo de conector: NEMA de 3 clavijas a conector hembra de 3 ranuras\nColor: Negro\nVoltage: 110-250V',NULL,5,15.00,'/uploads/1762643292915-760458414.webp',5,0,'no','disponible'),(20,'Accesorio Cable Poder Universal LAPTOP','Conductor material : Aluminio recubierto de cobre\nTipo: Cable de alimentación para computador portátil\nTipo de conector: TREBOL\nColor: Negro\nVoltage: 110-250V',NULL,5,15.00,'/uploads/1762643384671-676797055.webp',5,1,'no','disponible'),(21,'Accesorio Cable de Poder Impresora','Cable de poder de 2 puntas de alta calidad para Canon, EPSON, HP y otros modelos\nColor negro',NULL,5,15.00,'/uploads/1762643822183-721020918.webp',5,1,'no','disponible'),(22,'Accesorio Cable USB Impresora','Cable USB 2.0 Para Impresora',NULL,5,15.00,'/uploads/1762643886129-487256576.webp',5,1,'no','disponible'),(23,'Mouse óptico TEROS TE-1229S','USB, 4 botones, Color negro',NULL,4,25.00,'/uploads/1762645522118-470469324.webp',5,1,'no','disponible'),(24,'Mouse óptico TEROS TE-1225S','Resolución 800-1200-1600 DPI, USB, 4 botones, color blanco',NULL,4,25.00,'/uploads/1762645572107-594566418.webp',5,1,'no','disponible'),(25,'Mouse inalámbrico TEROS TE-1228S','Color Negro, 6 botones, Receptor USB',NULL,4,30.00,'/uploads/1762645615072-121380806.webp',5,1,'no','disponible'),(26,'Mouse gamer TEROS TE-1233G','Resolución DPI hasta 7200, Luces RGB, 7 botones, USB, Color negro',NULL,4,46.99,'/uploads/1762645746221-105100944.webp',5,1,'no','disponible');
/*!40000 ALTER TABLE `producto` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

--
-- Table structure for table `venta`
--

DROP TABLE IF EXISTS `venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venta` (
  `id_venta` int NOT NULL AUTO_INCREMENT,
  `id_pedido` int DEFAULT NULL,
  `fecha_venta` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','transferencia','tarjeta','otro') COLLATE utf8mb4_general_ci DEFAULT 'efectivo',
  PRIMARY KEY (`id_venta`),
  KEY `id_pedido` (`id_pedido`),
  CONSTRAINT `venta_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedido` (`id_pedido`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venta`
--

LOCK TABLES `venta` WRITE;
/*!40000 ALTER TABLE `venta` DISABLE KEYS */;
/*!40000 ALTER TABLE `venta` ENABLE KEYS */;
UNLOCK TABLES;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-13 12:12:13
