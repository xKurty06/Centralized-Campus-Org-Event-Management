# SALIKOP

## Project Title
SALIKOP: Centralized Campus Organization & Event Management System

## Course Requirement
This project is the final requirement for DCIT 55 - Advanced Database Management System. The requirement is a **DATABASE-DRIVEN WEB APPLICATION** built for campus organization and event management.

## School & Team
- **Institution:** Cavite State University - Main Campus, Indang, Cavite
- **Program:** Bachelor of Science in Computer Science (BSCS 2-2)
- **Group Members:**
  - Balboa, Zean Kurt G.
  - Ibasco, Lawrence Rain
  - Reyes, Raphael A.

## Project Overview
SALIKOP is a web-based platform designed to centralize the management of student organizations, campus events, and participant registrations. It replaces disconnected manual processes like social media announcements, printed sign-up sheets, and paper-based payment verification with a single unified system for students, organization officers, and administrators.

## Key Features
- Central event discovery for all campus activities
- Public organization directory grouped by Academic, Non-Academic, and Religious organizations
- Student registration with automatic profile and School ID matching
- Paid event payment verification and attendance confirmation
- Role-based access for Guests, Students, Organization Officers, and Administrators
- Offline-capable entrance panel for venue payment and check-in verification
- Transactional notifications and registration tracking

## User Roles
- **Guest:** Browse events and organization information without registering
- **Student:** Register for events, view registrations, and manage profile data
- **Organization Officer:** Create and manage events, verify payments, and review participants
- **Administrator / Overseer:** Manage organizations, users, events, and accreditation status

## System Modules
- Authentication & User Management
- Organization Management
- Event Management and Catalog
- Participant Registration and Dashboard
- Manual ID Verification and Offline Sync
- Notifications and Admin Oversight

## Technical Stack
- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Laravel (PHP)
- **Database:** MySQL
- **Deployment Target:** Campus-hosted web environment or local development server

## Purpose and Impact
SALIKOP aims to improve campus event coordination by providing one central digital environment for discovering events, registering participants, and verifying payments at the venue. The system supports more efficient communication between student organizations and their audience while reducing manual errors and administrative overhead.

## Folder Structure
- `/app` — Frontend application code
- `/backend` — Laravel backend application and API
- `/backend/context` — Project concept, modules, pages, and database design documents

## Notes
This README summarizes the overall system, course context, and the final project requirement as a database-driven web application. For detailed implementation notes, review the files in `/backend/context`.
