# Overview

This is a question paper solution generator web application that allows students to upload question papers in various formats (PDF, PNG, text) and automatically generates detailed solutions using AI. The application features a modern React frontend with a beautiful UI built using Tailwind CSS and shadcn/ui components, backed by an Express.js server that handles file processing, OCR text extraction, and AI-powered solution generation.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript running on Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, modern UI components
- **State Management**: TanStack Query (React Query) for server state management and API caching
- **Routing**: Wouter for lightweight client-side routing
- **File Handling**: React Dropzone for drag-and-drop file uploads with support for PDF, PNG, JPEG, and text files
- **UI Components**: Comprehensive set of accessible components from Radix UI primitives wrapped with custom styling

## Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **File Processing**: Multer middleware for handling multipart file uploads with 10MB size limits
- **Development**: Hot reloading with Vite integration for seamless development experience
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Logging**: Custom request logging middleware for API endpoint monitoring

## Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for database migrations and schema synchronization
- **Connection**: Neon Database serverless PostgreSQL for cloud database hosting
- **Tables**: Users table for authentication and question_papers table for storing processed documents and solutions

## Text Processing & AI Integration
- **OCR Engine**: Tesseract.js for extracting text from images with preprocessing using Sharp for image enhancement
- **PDF Processing**: pdf-parse library for extracting text content from PDF documents
- **AI Solutions**: Google Gemini AI (using @google/genai) for generating detailed step-by-step solutions
- **Content Processing**: Markdown formatting for structured solution presentation with ReactMarkdown for rendering

## External Dependencies

- **Google Gemini AI**: Core AI service for generating educational solutions and answers
- **Neon Database**: Serverless PostgreSQL database hosting platform
- **Tesseract.js**: Browser-based OCR engine for image text extraction
- **Sharp**: High-performance image processing for OCR preprocessing
- **Radix UI**: Accessible component primitives for building the user interface
- **Tailwind CSS**: Utility-first CSS framework for styling
- **TanStack Query**: Data fetching and caching library for API state management
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL operations