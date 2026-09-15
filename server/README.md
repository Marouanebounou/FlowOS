# FlowOS Server

FlowOS is a modular workspace platform for organizations. This repository contains the Spring Boot backend.

## Current State

The project currently contains:

- Spring Boot application setup
- MySQL database configuration
- Core JPA entities for organizations, users, teams, roles, permissions, modules, notifications, and audit logs
- Initial entity relationship documentation

Authentication, REST endpoints, services, repositories, and database migrations are not built yet.

## Technology

- Java 21
- Spring Boot
- Spring Data JPA
- Spring Security
- MySQL
- Maven
- Lombok

## Requirements

- JDK 21
- MySQL Server

## Database Setup

Create the database:

```sql
CREATE DATABASE flowos;
```

Create a `.env` file in the project root with your local MySQL connection values:

```properties
DB_URL=jdbc:mysql://localhost:3306/flowos
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

A template is available in [`.env.example`](.env.example). The `.env` file is ignored by Git.

## Run the Application

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Compile the project:

```powershell
.\mvnw.cmd compile
```

Run tests:

```powershell
.\mvnw.cmd test
```

## Project Structure

```text
src/main/java/com/example/flowos
├── Controllers     REST API endpoints
├── Dto             Request and response objects
├── Enums           Fixed application values
├── Mappers         Entity and DTO conversion
├── Models          JPA database entities
├── Repositories    Database access interfaces
├── Services        Business logic
└── Utils           Shared utility classes
```

## Documentation

- [Core entity relationships](CORE_ENTITY_RELATIONSHIPS.md)
- [Architecture notes](ARCHITECTURE.md)
- [Project guide](HELP.md)
