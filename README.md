# Proyecto Node.js
Proyecto Node.js! Este proyecto demuestra cómo construir una aplicación Node.js con Express, PostgreSQL, y Jest para pruebas unitarias. A continuación, encontrarás una guía para configurar el proyecto, ejecutar pruebas, y comprender la estructura básica.

## Descripción

Este proyecto es una aplicación Node.js que implementa diversas funcionalidades típicas de un backend, incluyendo autenticación de usuarios, gestión de transacciones, y consultas a una API externa para obtener restaurantes cercanos. Utiliza Express como framework web, PostgreSQL como base de datos relacional, y Jest para pruebas unitarias.

## Funcionalidades

- **Autenticación de Usuarios**: Registro, inicio de sesión, y cierre de sesión.
- **Gestión de Transacciones**: Consulta de transacciones filtradas por diversos parámetros.
- **API de Restaurantes Cercanos**: Consulta de restaurantes cercanos usando la API de Google Places.
- **Pruebas Unitarias**: Utilización de Jest y Supertest para pruebas automatizadas.

## Configuración

### Requisitos Previos

- Node.js y npm instalados globalmente en tu máquina.
- PostgreSQL instalado y configurado.
- Una cuenta de Google Cloud con acceso a la API de Google Places.

### Pasos de Instalación

1. **Clonar el Repositorio**:

   ```bash
   git clone <repository-url>
2.**Instalar Dependencias**:
npm install

3.**Configurar Variables de Entorno**:
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_DATABASE=
DB_PORT=
PGADMIN_DEFAULT_EMAIL=
PGADMIN_DEFAULT_PASSWORD=

PORT=

API_KEY=
KEY_JWT=
TOKEN_TEMP=
3.**ejecucion**:
npm run dev
4.**pruebas unitarias**:
npm test
