-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: car_rental
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

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

--
-- Table structure for table `blacklists`
--

DROP TABLE IF EXISTS `blacklists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blacklists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_blacklist` (`shop_id`,`customer_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `blacklists_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `blacklists_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blacklists`
--

LOCK TABLES `blacklists` WRITE;
/*!40000 ALTER TABLE `blacklists` DISABLE KEYS */;
/*!40000 ALTER TABLE `blacklists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `car_images`
--

DROP TABLE IF EXISTS `car_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `car_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `car_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_car_images_car` (`car_id`),
  CONSTRAINT `fk_car_images_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `car_images`
--

LOCK TABLES `car_images` WRITE;
/*!40000 ALTER TABLE `car_images` DISABLE KEYS */;
INSERT INTO `car_images` VALUES (1,1,'/uploads/car_images-1756309795951-335178539.jpg',1,'2025-08-27 15:49:55'),(2,2,'/uploads/car_images-1756310003780-665510382.jpg',1,'2025-08-27 15:53:23'),(3,3,'/uploads/car_images-1756310132305-616385148.jpg',1,'2025-08-27 15:55:32'),(4,4,'/uploads/car_images-1756310314958-229635126.jpg',1,'2025-08-27 15:58:34'),(5,5,'/uploads/car_images-1756310573706-540258429.jpg',1,'2025-08-27 16:02:53'),(6,6,'/uploads/car_images-1756310714732-184668139.jpg',1,'2025-08-27 16:05:14'),(7,7,'/uploads/car_images-1756310847422-584085726.webp',1,'2025-08-27 16:07:27'),(8,8,'/uploads/car_images-1756310998620-802714523.webp',1,'2025-08-27 16:09:58'),(9,9,'/uploads/car_images-1756311280236-552372078.jpg',1,'2025-08-27 16:14:40'),(10,10,'/uploads/car_images-1756311490951-680009476.jpg',1,'2025-08-27 16:18:10'),(11,11,'/uploads/car_images-1756311615288-884054393.webp',1,'2025-08-27 16:20:15'),(12,12,'/uploads/car_images-1756312393823-635730855.avif',1,'2025-08-27 16:33:13'),(13,13,'/uploads/car_images-1756312702381-630864964.avif',1,'2025-08-27 16:38:22'),(14,14,'/uploads/car_images-1756312930743-242675691.avif',1,'2025-08-27 16:42:10'),(15,15,'/uploads/car_images-1756313260728-320162869.jpg',1,'2025-08-27 16:47:40'),(16,16,'/uploads/car_images-1756313532852-672088714.avif',1,'2025-08-27 16:52:12'),(17,17,'/uploads/car_images-1756313744615-212838745.jpg',1,'2025-08-27 16:55:44'),(18,18,'/uploads/car_images-1756313994960-476808652.jpg',1,'2025-08-27 16:59:54'),(19,19,'/uploads/car_images-1756314343889-316145314.avif',1,'2025-08-27 17:05:43'),(20,20,'/uploads/car_images-1756314624556-12216945.jpg',1,'2025-08-27 17:10:24'),(21,21,'/uploads/car_images-1756314856473-106923256.jpg',1,'2025-08-27 17:14:16'),(22,22,'/uploads/car_images-1756315099425-830892777.jpg',1,'2025-08-27 17:18:19'),(23,23,'/uploads/car_images-1756450897119-79743101.jpg',1,'2025-08-29 07:01:37'),(24,24,'/uploads/car_images-1757089330120-635560045.png',1,'2025-09-05 16:22:10');
/*!40000 ALTER TABLE `car_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cars`
--

DROP TABLE IF EXISTS `cars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cars` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `brand` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `year` int(11) NOT NULL,
  `license_plate` varchar(20) NOT NULL,
  `car_type` enum('sedan','suv','hatchback','pickup','van','luxury','motorbike') NOT NULL DEFAULT 'sedan',
  `transmission` enum('auto','manual') NOT NULL DEFAULT 'auto',
  `fuel_type` enum('gasoline','diesel','hybrid','electric') NOT NULL DEFAULT 'gasoline',
  `seats` int(11) NOT NULL,
  `color` varchar(50) NOT NULL,
  `daily_rate` decimal(10,2) NOT NULL,
  `insurance_rate` decimal(10,2) DEFAULT 0.00,
  `status` enum('available','rented','maintenance','hidden') NOT NULL DEFAULT 'available',
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_cars_shop` (`shop_id`),
  CONSTRAINT `fk_cars_shop` FOREIGN KEY (`shop_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cars`
--

LOCK TABLES `cars` WRITE;
/*!40000 ALTER TABLE `cars` DISABLE KEYS */;
INSERT INTO `cars` VALUES (1,1,'minicooper','minicooper s',2025,'ศศ 3333 ขอนแก่น','sedan','auto','diesel',4,'ดำ',2000.00,10000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756309795951-335178539.jpg','2025-08-27 15:49:48','2025-09-03 19:46:19'),(2,1,'Honda','civic',2025,'ขค 5678 เชียงใหม่','sedan','auto','diesel',4,'ขาว',3000.00,2500.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756310003780-665510382.jpg','2025-08-27 15:53:07','2025-09-04 14:35:16'),(3,1,'Toyota','Altis',2025,'กข 1234 กรุงเทพมหานค','sedan','auto','gasoline',4,'ขาว',2500.00,3000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756310132305-616385148.jpg','2025-08-27 15:55:17','2025-08-27 15:55:32'),(4,1,'Toyota','Vigo Champ',2011,'นม 9012 ภูเก็ต','pickup','manual','gasoline',4,'บอนซ์',2000.00,1000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756310314958-229635126.jpg','2025-08-27 15:58:23','2025-08-27 16:02:24'),(5,1,'Suzuki','Swift',2013,'คง 8888 ภูเก็ต','sedan','auto','gasoline',4,'เทา',1000.00,500.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756310573706-540258429.jpg','2025-08-27 16:02:05','2025-08-27 16:10:40'),(6,1,'Nissan','Almera',2021,'ฉช 1122 นครราชสีมา','sedan','auto','gasoline',4,'เทา',3000.00,2500.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756310714732-184668139.jpg','2025-08-27 16:05:02','2025-08-27 16:11:45'),(7,1,'Toyota','Vios',2025,'ซฌ 5566 อุดรธานี','sedan','auto','gasoline',4,'เทา',4000.00,3500.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756310847422-584085726.webp','2025-08-27 16:07:08','2025-08-27 16:11:37'),(8,1,'Mercedes-benz','A-Class',2025,'ญฎ 9900 ชลบุรี','luxury','auto','gasoline',4,'ขาว',6000.00,5000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756310998620-802714523.webp','2025-08-27 16:09:34','2025-08-27 16:12:03'),(9,1,'BMW','5 Series',2025,'ฐฑ 3434 นครปฐม','luxury','auto','gasoline',4,'ขาว',6000.00,3000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756311280236-552372078.jpg','2025-08-27 16:14:34','2025-09-09 14:52:54'),(10,1,'Honda','Jazz',2017,'ฒณ 7878 ลำปาง','sedan','auto','gasoline',4,'ขาว',1000.00,500.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756311490951-680009476.jpg','2025-08-27 16:17:58','2025-08-27 16:18:22'),(11,1,'Honda','HRV',2024,'ดต 1010 มหาสารคาม','pickup','auto','gasoline',4,'ทองเทา',2000.00,1000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756311615288-884054393.webp','2025-08-27 16:19:59','2025-09-09 14:58:02'),(12,1,'Mercedes-benz','v class',2025,'ษส 1289 พะเยา','van','auto','gasoline',6,'เทา',5000.00,1000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756312393823-635730855.avif','2025-08-27 16:32:59','2025-09-03 19:46:57'),(13,1,'Ferrari','F80',2025,'ถท 1777 เชียงใหม่','luxury','auto','hybrid',2,'แดง',50000.00,30000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756312702381-630864964.avif','2025-08-27 16:38:04','2025-09-05 16:13:44'),(14,1,'Jeep wrangler','rubicon',2024,'ญฎ 1601 ปทุมธานี','hatchback','manual','electric',4,'แดง',6000.00,2000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756312930743-242675691.avif','2025-08-27 16:41:55','2025-09-03 19:47:51'),(15,1,'Ford','bronco',2024,'ฉช 1522 อุดรธานี','pickup','auto','hybrid',4,'เหลือง',2000.00,1000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756313260728-320162869.jpg','2025-08-27 16:47:33','2025-09-08 17:55:35'),(16,1,'BMW','X5',2025,'ฬอ 1346 ลำปาง','suv','auto','gasoline',4,'น้ำเงิน',4500.00,2000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756313532852-672088714.avif','2025-08-27 16:52:07','2025-09-04 14:35:17'),(17,1,'Cadillac','Escalade',2025,'วศ 1245 อ่างทอง','suv','auto','gasoline',4,'แดง',7000.00,4000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756313744615-212838745.jpg','2025-08-27 16:55:09','2025-09-08 17:12:14'),(18,1,'Mercedes-amg','ONE',2022,'ปผ-1023 เชียงราย','luxury','auto','hybrid',2,'น้ำเงิน',200000.00,100000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756313994960-476808652.jpg','2025-08-27 16:59:44','2025-09-03 19:48:43'),(19,1,'Porsche','Cayenne',2025,'ณด 8889 นราธิวาส','suv','auto','hybrid',4,'เทาเมทัลลิก',5000.00,2500.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756314343889-316145314.avif','2025-08-27 17:05:30','2025-08-27 17:05:59'),(20,1,'Porsche 911','GT3',2025,'จฉ 1500 นครศรีธรรมรา','luxury','auto','hybrid',2,'ขาว',10000.00,5000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756314624556-12216945.jpg','2025-08-27 17:09:49','2025-09-09 14:56:54'),(21,1,'Nissan','GTR R35',2025,'กข 1412 สุพรรณบุรี','sedan','auto','gasoline',4,'เทา',90000.00,45000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756314856473-106923256.jpg','2025-08-27 17:13:49','2025-08-27 17:14:16'),(22,1,'Ford','Mustang Dark Horse',2024,'ซฌ-1566 ชลบุรี','luxury','auto','gasoline',4,'ดำ',30000.00,10000.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/car_images-1756315099425-830892777.jpg','2025-08-27 17:17:32','2025-09-06 08:48:06'),(23,1,'Honda','Scoopy i',2025,'ศศ 9999 ลำยอง','motorbike','auto','gasoline',2,'ดำ',120.00,100.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/image-1757326173754-403465532.jpg','2025-08-29 07:01:26','2025-09-08 17:55:40'),(24,1,'Honda','wave',2025,'กง 1111 เพชรบูรณ์','motorbike','auto','gasoline',2,'เทา',100.00,10.00,'available','- โปรดใช้งานรถด้วยความระมัดระวัง หลีกเลี่ยงการใช้งานที่เกินกำลังของเครื่องยนต์\n- ควรขับขี่และใช้งานอย่างเหมาะสม เพื่อยืดอายุการใช้งานของรถ\n- งดการใช้งานในลักษณะหักโหมหรือเกินสมรรถนะที่กำหนด\n- กรุณาใช้รถด้วยความนุ่มนวล ไม่ควรใช้งานหนักอย่างต่อเนื่อง\n- เพื่อความปลอดภัยและการบำรุงรักษาที่ดี กรุณาหลีกเลี่ยงการใช้งานเกินขีดจำกัดของรถ','/uploads/image-1757090301778-314042193.jpg','2025-09-05 16:22:03','2025-09-08 19:18:27');
/*!40000 ALTER TABLE `cars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rental_id` int(11) NOT NULL,
  `payment_method` enum('credit_card','bank_transfer','cash','qr_code','promptpay') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` datetime DEFAULT NULL,
  `payment_status` enum('pending','pending_verification','paid','rejected','failed','refunded') NOT NULL DEFAULT 'pending',
  `transaction_id` varchar(100) DEFAULT NULL,
  `proof_image` varchar(255) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verified_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_payments_rental` (`rental_id`),
  KEY `fk_payments_verified_by` (`verified_by`),
  CONSTRAINT `fk_payments_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (7,7,'promptpay',11000.00,'2025-09-02 17:43:17','paid',NULL,'/uploads/payments/payment-1756809797645-871015841.png','2025-09-02 17:44:12',1,'2025-09-02 10:43:17'),(26,26,'promptpay',130000.00,'2025-09-04 20:15:31','paid',NULL,'/uploads/payments/payment-1756991731391-571002811.png','2025-09-04 21:39:25',1,'2025-09-04 13:15:31'),(27,27,'promptpay',8500.00,'2025-09-04 20:31:13','paid',NULL,'/uploads/payments/payment-1756992673097-794552266.jpg','2025-09-04 20:32:03',1,'2025-09-04 13:31:13'),(28,28,'promptpay',11000.00,'2025-09-04 20:50:23','paid',NULL,'/uploads/payments/payment-1756993823846-279577509.jpg','2025-09-04 20:53:36',1,'2025-09-04 13:50:23'),(29,42,'promptpay',5500.00,'2025-09-05 23:04:38','rejected',NULL,'/uploads/payments/payment-1757088278968-106282741.png','2025-09-06 16:25:45',1,'2025-09-05 16:04:38'),(30,43,'promptpay',220.00,'2025-09-05 23:09:10','paid',NULL,'/uploads/payments/payment-1757088550963-292795470.png','2025-09-06 16:25:41',1,'2025-09-05 16:09:10'),(31,44,'promptpay',6500.00,'2025-09-06 01:42:45','pending_verification',NULL,'/uploads/payments/payment-1757097765382-980152575.png',NULL,NULL,'2025-09-05 18:42:45'),(32,45,'promptpay',110.00,'2025-09-06 16:47:45','paid',NULL,'/uploads/payments/payment-1757152065791-933747822.png','2025-09-06 16:48:11',1,'2025-09-06 09:47:45'),(33,46,'promptpay',15000.00,'2025-09-06 17:27:21','paid',NULL,'/uploads/payments/payment-1757154441402-537275203.png','2025-09-06 17:33:32',1,'2025-09-06 10:27:21'),(34,47,'promptpay',220.00,'2025-09-07 19:57:31','paid',NULL,'/uploads/payments/payment-1757249851376-449146546.png','2025-09-07 20:00:18',1,'2025-09-07 12:57:31'),(35,48,'promptpay',11000.00,'2025-09-07 20:01:56','pending_verification',NULL,'/uploads/payments/payment-1757250116290-736889581.png',NULL,NULL,'2025-09-07 13:01:56'),(36,49,'promptpay',5500.00,'2025-09-07 20:17:06','rejected',NULL,'/uploads/payments/payment-1757251026099-733264620.png','2025-09-07 20:17:35',1,'2025-09-07 13:17:06'),(37,50,'promptpay',3000.00,'2025-09-07 20:27:46','paid',NULL,'/uploads/payments/payment-1757251666712-244246629.png','2025-09-07 21:58:01',1,'2025-09-07 13:27:46'),(38,51,'promptpay',220.00,'2025-09-07 22:46:00','paid',NULL,'/uploads/payments/payment-1757259960400-400600086.png','2025-09-08 17:02:32',1,'2025-09-07 15:46:00'),(39,53,'promptpay',11000.00,'2025-09-08 17:38:27','paid',NULL,'/uploads/payments/payment-1757327907328-743425642.png','2025-09-08 23:21:08',1,'2025-09-08 10:38:27'),(40,55,'promptpay',15000.00,'2025-09-09 03:19:57','paid',NULL,'/uploads/payments/payment-1757362797603-497016114.png','2025-09-09 03:38:54',1,'2025-09-08 20:19:57');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rentals`
--

DROP TABLE IF EXISTS `rentals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rentals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `car_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `shop_acknowledged_at` datetime DEFAULT NULL,
  `pickup_location` varchar(255) DEFAULT NULL,
  `return_location` varchar(255) DEFAULT NULL,
  `rental_status` enum('pending','confirmed','ongoing','completed','cancelled','return_requested','return_approved') NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','pending_verification','paid','rejected','refunded','failed') NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  `deposit_amount` decimal(10,2) DEFAULT NULL,
  `insurance_rate` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_rentals_car` (`car_id`),
  KEY `fk_rentals_customer` (`customer_id`),
  KEY `fk_rentals_shop` (`shop_id`),
  KEY `idx_rentals_shop_status_ack` (`shop_id`,`rental_status`,`shop_acknowledged_at`),
  CONSTRAINT `fk_rentals_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`),
  CONSTRAINT `fk_rentals_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_rentals_shop` FOREIGN KEY (`shop_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rentals`
--

LOCK TABLES `rentals` WRITE;
/*!40000 ALTER TABLE `rentals` DISABLE KEYS */;
INSERT INTO `rentals` VALUES (7,16,2,1,'2025-09-03','2025-09-05',NULL,'ที่ร้าน','ที่ร้าน','return_approved','paid',11000.00,NULL,2000.00,'2025-09-02 10:43:11','2025-09-02 11:00:34'),(26,13,2,1,'2025-09-05','2025-09-07','2025-09-04 20:15:58','ที่ร้าน','ที่ร้าน','return_approved','paid',130000.00,NULL,30000.00,'2025-09-04 13:15:25','2025-09-05 16:13:44'),(27,2,2,1,'2025-09-05','2025-09-07',NULL,'ที่ร้าน','ที่ร้าน','return_approved','paid',8500.00,NULL,2500.00,'2025-09-04 13:31:06','2025-09-04 14:35:16'),(28,16,2,1,'2025-09-05','2025-09-07',NULL,'ที่ร้าน','ที่ร้าน','return_approved','paid',11000.00,NULL,2000.00,'2025-09-04 13:50:18','2025-09-04 14:35:17'),(42,2,2,1,'2025-09-06','2025-09-07','2025-09-06 16:40:53','45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา','45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา','cancelled','rejected',5500.00,NULL,2500.00,'2025-09-05 16:02:45','2025-09-06 09:40:53'),(43,23,2,1,'2025-09-06','2025-09-07',NULL,'45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา','45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา','return_approved','paid',220.00,NULL,100.00,'2025-09-05 16:09:03','2025-09-06 09:44:00'),(44,16,2,1,'2025-09-15','2025-09-16','2025-09-06 13:55:26','45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา','45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา','cancelled','pending_verification',6500.00,NULL,2000.00,'2025-09-05 18:41:10','2025-09-06 06:55:26'),(45,24,2,1,'2025-09-07','2025-09-08',NULL,'ที่ร้าน','ที่ร้าน','return_approved','paid',110.00,NULL,10.00,'2025-09-06 09:47:39','2025-09-07 13:03:33'),(46,20,2,1,'2025-09-07','2025-09-08',NULL,'ที่ร้าน','ที่ร้าน','return_approved','paid',15000.00,NULL,5000.00,'2025-09-06 10:27:10','2025-09-08 10:01:33'),(47,23,2,1,'2025-09-07','2025-09-08',NULL,'45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา','45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา','return_approved','paid',220.00,NULL,100.00,'2025-09-07 12:57:17','2025-09-07 13:14:37'),(48,17,2,1,'2025-09-08','2025-09-09','2025-09-07 20:05:05','45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา','45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา','cancelled','pending_verification',11000.00,NULL,4000.00,'2025-09-07 13:01:47','2025-09-07 13:05:05'),(49,2,2,1,'2025-09-07','2025-09-08','2025-09-07 21:58:34','ที่ร้าน',NULL,'cancelled','rejected',5500.00,NULL,2500.00,'2025-09-07 13:16:57','2025-09-07 14:58:34'),(50,15,2,1,'2025-09-07','2025-09-08',NULL,'ที่ร้าน','ที่ร้าน','return_approved','paid',3000.00,NULL,1000.00,'2025-09-07 13:27:37','2025-09-08 17:55:35'),(51,23,2,1,'2025-09-07','2025-09-08',NULL,'ที่ร้าน','ที่ร้าน','return_approved','paid',220.00,NULL,100.00,'2025-09-07 15:45:49','2025-09-08 17:55:40'),(52,11,2,1,'2025-09-08','2025-09-09',NULL,'ที่ร้าน','ที่ร้าน','confirmed','pending',3000.00,NULL,1000.00,'2025-09-08 10:35:40','2025-09-08 16:21:10'),(53,17,2,1,'2025-09-08','2025-09-09',NULL,'ที่ร้าน','ที่ร้าน','return_approved','paid',11000.00,NULL,4000.00,'2025-09-08 10:38:19','2025-09-08 17:12:14'),(54,24,2,1,'2025-09-09','2025-09-10','2025-09-08 21:32:49',NULL,NULL,'cancelled','pending',110.00,NULL,10.00,'2025-09-08 12:04:20','2025-09-08 14:32:49'),(55,20,2,1,'2025-09-09','2025-09-10',NULL,NULL,NULL,'confirmed','paid',15000.00,NULL,5000.00,'2025-09-08 19:48:26','2025-09-08 20:38:54');
/*!40000 ALTER TABLE `rentals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rental_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `car_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_reviews_rental` (`rental_id`),
  KEY `fk_reviews_customer` (`customer_id`),
  KEY `fk_reviews_shop` (`shop_id`),
  KEY `fk_reviews_car` (`car_id`),
  CONSTRAINT `fk_reviews_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`),
  CONSTRAINT `fk_reviews_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_reviews_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`),
  CONSTRAINT `fk_reviews_shop` FOREIGN KEY (`shop_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (2,7,2,1,16,5,NULL,'2025-09-03 05:38:36'),(3,27,2,1,2,5,NULL,'2025-09-05 15:15:08'),(4,28,2,1,16,3,NULL,'2025-09-05 15:15:12'),(5,26,2,1,13,5,NULL,'2025-09-05 16:27:15'),(6,43,2,1,23,5,'Good car','2025-09-06 09:44:57'),(7,45,2,1,24,5,NULL,'2025-09-07 13:06:21'),(8,53,2,1,17,5,NULL,'2025-09-08 17:54:53'),(9,46,2,1,20,5,NULL,'2025-09-08 17:54:58'),(10,47,2,1,23,5,NULL,'2025-09-08 17:54:59'),(11,51,2,1,23,5,NULL,'2025-09-08 18:06:04'),(12,50,2,1,15,5,NULL,'2025-09-08 18:06:05');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('customer','shop') NOT NULL DEFAULT 'customer',
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `shop_name` varchar(255) DEFAULT NULL,
  `shop_description` text DEFAULT NULL,
  `promptpay_id` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `policy` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'SP_Shop','sp123@gmail.com','$2b$10$3gnZrf6qn9blYGKFdvoEWeZd45kQVhSP32w/ejxIM11SMM2puGi/O','shop','0622489731','45/7 หมู่ 3 ถนนเลียบชายหาด ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา 90110',NULL,'active','SPSHOP',NULL,'0622489731','2025-08-27 15:47:01','1.เงื่อนไขการเช่ารถขับเอง  \n- ผู้เช่ารถเช่า ต้องมีอายุ 20 ปีขึ้นไป \n- ผู้ขับขี่รถเช่าต้องมีใบอนุญาตขับขี่รถยนต์ \n- ผู้ขับขี่ต้องเป็นบุคคลซึ่งระบุไว้ในสัญญาเช่าเท่านั้น \n- เช่ารถเป็นรายวันครบกำหนด 1 วัน ใน 24 ชั่วโมง ส่งรถคืนเกินเวลา คิดเพิ่มชั่วโมงละ 100 บาท เกิน 4 ชั่วโมงขึ้นไป คิดเป็น 1 วัน \n- เงินประกัน 3000 บาท \n\n2.เงื่อนไขการให้บริการรถเช่า \n2.1 คุณสมบัติของผู้เช่า \n-  คนขับต้องมีอายุ ตั้งแต่ 20 ปีขึ้นไปหรือผู้ที่มีใบขับขี่ \n-  มีใบขับขี่ไทย หรือ ใบขับขี่สากลที่ไม่หมดอายุเท่านั้น \n-  มีบัตรประจำตัวประชาชนหรือหนังสือเดินทาง ทั้งหมดต้องเป็นตัวจริงและทั้งหมดต้องไม่หมดอายุ \n2.2 ข้อตกลง \n- ห้ามนำรถไปให้ผู้ใดใช้หรือเช่า เช่าช่วงต่อหรือ ห้ามนำไปให้ผู้ที่ไม่ได้มาทำสัญญาเช่าและไม่มีใบขับขี่เป็นคนขับรถยนต์ \n- งดการดื่มสุราและยาเสพติดเมื่อต้องขับรถยนต์ เพราะบริษัทประกันภัยจะไม่คุ้มครอง โดยผู้เช่าจะต้องจ่ายค่าเสียหายเองทั้งหมดกรณีรถเกิดอุบัติเหตุ \n- ปฏิบัติตามกฎจราจรอย่างเคร่งครัด และขับขี่ด้วยความไม่ประมาท หากทำผิด กฎจราจร เช่น ขับเร็วเกินกว่ากฎหมายกำหนด หรือ ฝ่าเส้นทึบ และไฟแดง หรือ กรณีต่างๆ จนมีใบค่าปรับส่งมาที่บริษัทลูกค้าจะต้องจ่ายเองทั้งหมด โดยร้านเช่าจะเรียกเก็บกับลูกค้าอีกครั้งคำใช้จ่ายเบื้องต้น 600 บาท \n- ผู้เช่าต้องระมัดระวังเรื่องรถหาย เมื่อรถที่เช่าหาย ท่านต้องชำระค่าเสียหายร้อยละ 50 ของราคารถยนต์ที่ประเมินไว้หรือส่วนต่างค่าใช้จ่ายส่วนเกิน ที่บริษัทประกันภัยไม่ได้คุ้มครอง โดยบริษัทประกันภัยจะจ่ายบางส่วนตามที่ระบุไว้ในกรมธรรม์ \n\n3. เงื่อนไขประกันภัยสำหรับรถเช่า (**หมายเหตุ ประกันภัยชั้น 1 จะไม่คุ้มครองใน 4 ประเด็นเหล่านี้) \n- ค่ารถยกทั้งหมด ฟรีค่ารถลากรถยก 20 กิโลเมตรแรก หลังจากนั้นลูกค้าต้อง จ่ายเองหรือตามที่ประกันภัยเรียกเก็บ(ถ้ากรณีต้องยกรถซึ่งเกิดจาก อุบัติเหตุที่ ลูกค้ากระทำหรือถูกกระทำ ลูกค้าต้องจ่ายค่ารถยก เพิ่มเติมเอง) \n- ยางรถยนต์ หากยางรั่วลูกค้าต้องซ่อมปะยางมาคืนบริษัทหากยางแตกลูกค้า จะต้องซื้อยาง ยี่ห้อเก่า และลายเติมให้บริษัทใหม่ \n- กระจกถ้าหากเกิดความเสียหาย ผู้เช่าจะต้องเป็นผู้รับผิดชอบ \n- อุปกรณ์ภายในรถยนต์ทั้งหมด เช่น เอกสารภายในรถยนต์ เบาะรถยนต์ ยาง อะไหล่แม่แรง กุญแจและอื่นๆ เป็นต้น หากอุปกรณ์ที่ลูกค้าทำชำรุดหรือสูญหาย ในระหว่างการเช่ารถยนต์ ลูกค้าต้องจ่ายค่าปรับทั้งหมดตามรายการที่ร้านให้เช่าเรียกเก็บ จะใช้เกณฑ์ราคาค่าปรับตามราคาที่ศูนย์บริการรถยนต์ยี่ห้อนั้นๆ กำหนดขึ้นและค่าบริการตามจริง \n- กรณีรถเกิดอุบัติเหตุทางรถยนต์รถจะมีประกันภัยชั้น 1 หากลูกค้าเป็นฝ่ายผิดหรือเป็นกรณีอุบัติเหตุไม่มีคู่กรณี ลูกค้าจะต้องเสียค่าเปิดเคลมประกันตามที่บริษัทประกันภัยกำหนดและลูกค้าจะต้องรับผิดชอบรายได้ที่จะเกิดขึ้นจากการปล่อยเช่าตามจำนวนวันที่ส่งซ่อม กรณีอุบัติเหตุเล็กน้อยเช่นรอยขีดข่วนขึ้นอยู่กับการตกลงกันกับทางร้านให้เช่า \n\n4.น้ำมันเชื้อเพลิงในการเดินทาง \n- บริษัทจะเติมน้ำมันเบนซินแก๊สโซฮอล์ 95 ไว้ให้เต็มถังเมื่อผู้เช่ารถยนต์นำรถยนต์ มาส่งมอบคืนร้านจะต้องน้ำมันเบนซินแก๊สโซฮอล์ 95ให้เต็มถัง \n- ในกรณีที่ผู้เช่าผิดสัญญาเช่าข้อใดข้อหนึ่ง ทางผู้ให้เช่าสามารถยึดเงินประกันของผู้ให้เช่าได้ทันที \n- ในกรณีที่ผู้เช่าต้องการเช่ารถต่อแต่สิ้นสุดสัญญาแล้ว ให้ผู้เช่าต่อสัญญาใหม่ทุกครั้งมิเช่นนั้นจะถือว่าได้สิ้นสุดสัญญาการเช่าแล้ว และเป็นการครอบครองทรัพย์สินของผู้อื่นโดยมิชอบด้วยกฎหมาย \n- หากผู้เช่าไม่สามารถนำรถที่เช่ามาคืนตามเวลาที่กำหนดได้ ทางผู้ให้เช่าสามารถดำเนินคดีทางกฎหมายข้อหายักยอกทรัพย์แก่ผู้เช่าได้ทันที'),(2,'nampeung','npkyr1503@gmail.com','$2b$10$ZYj.sYH9uTJXorIaGI.mweG10bKivtaDIdt7aIyhJET7OQ8OJ0Mba','customer','0616012989','250/18 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมือง จังหวัดขอนแก่น 40000',NULL,'active',NULL,NULL,NULL,'2025-08-27 17:45:52',NULL),(3,'golf','golfza2546@gmail.com','$2b$10$hF3Yf4aRfQ.NGQcSVeuu8Ou3lNp/cizXkvmRetxwlJEWe4qu2li.y','customer',NULL,NULL,NULL,'active',NULL,NULL,NULL,'2025-09-09 14:39:23',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-09 22:12:35
